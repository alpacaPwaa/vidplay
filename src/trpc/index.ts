import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import crypto from "crypto";
import { PassThrough } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const fileTemplateEnum = z.enum(["TEMPLATE1", "TEMPLATE2"]);

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email)
      throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { success: true };
  }),

  createFile: privateProcedure
    .input(z.object({ name: z.string(), fileTemplate: fileTemplateEnum }))
    .mutation(async ({ ctx, input }) => {
      const { name, fileTemplate } = input;

      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id || !user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const dbUser = await db.user.findFirst({
        where: {
          id: user.id,
        },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in the database.",
        });
      }

      // Create the file with the userId obtained from the logged-in user
      const createdFile = await db.file.create({
        data: {
          name: name,
          userId: user.id, // Use the userId obtained from the logged-in user
          fileTemplate: fileTemplate,
        },
      });

      return createdFile;
    }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId, user } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return file;
    }),

  createVideo: privateProcedure
    .input(
      z.object({
        fileId: z.string(),
        promt: z.string(),
        video: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      const maxLength = 5;
      const secondMaxLength = 10;

      if (!user || !user.id || !user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const dbUser = await db.user.findFirst({
        where: {
          id: user.id,
        },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in the database.",
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const allQuestion = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt:
          "Write 1 general knowledge quiz with 4 choices and answer about " +
          input.promt +
          " Always start with keyword Question:, example Question: question. Then the choices, A, B, C, and D. Lastly, the correct answer which always must begin with the keyword Answer:, then the correct answer, example: Answer. A. Correct Answer",
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
      });

      console.log(allQuestion);

      // First Question

      const firstQuestionText = allQuestion.choices[0].text;

      const firstQuestionMatch = firstQuestionText.match(
        /Question:([\s\S]+?)\n[A-D]\. /
      );
      const firstQuestion = firstQuestionMatch
        ? firstQuestionMatch[1].trim()
        : "";

      const firstQuestionWords = firstQuestion.split(" ");
      let firstQuestionWordCount = firstQuestionWords.length;

      let concatenatedFirstQuestion = "";

      if (firstQuestionWordCount > secondMaxLength) {
        concatenatedFirstQuestion = firstQuestionWords
          .slice(0, maxLength)
          .join(" ");
        concatenatedFirstQuestion +=
          "\n" + firstQuestionWords.slice(maxLength, secondMaxLength).join(" ");
        concatenatedFirstQuestion +=
          "\n" + firstQuestionWords.slice(secondMaxLength).join(" ");
      } else if (firstQuestionWordCount > maxLength) {
        concatenatedFirstQuestion = firstQuestionWords
          .slice(0, maxLength)
          .join(" ");
        concatenatedFirstQuestion +=
          "\n" + firstQuestionWords.slice(maxLength).join(" ");
      } else {
        concatenatedFirstQuestion = firstQuestion;
      }

      console.log("Question:", concatenatedFirstQuestion);

      const firstChoicesRegex =
        /[A-D]\. (?!\b[A-D]\.|\nAnswer:\s)(.+?)(?=\n|$)/gs;
      const firstChoicesMatch = firstQuestionText.match(firstChoicesRegex);
      const firstChoicesFilter = firstChoicesMatch
        ? firstChoicesMatch
            .filter((choice) => choice.trim())
            .slice(0, 4)
            .map((choice) => choice.trim())
        : [];

      const firstChoices = firstChoicesFilter.join("\n");

      console.log("Choices:", firstChoices);

      const joinedFirstQuestionAndChoices =
        concatenatedFirstQuestion + "\n\n" + firstChoices;

      console.log("Question and Choices:", joinedFirstQuestionAndChoices);

      const firstAnswerMatch = firstQuestionText.match(/Answer: ([A-D]\. .+)/);
      const firstAnswer = firstAnswerMatch ? firstAnswerMatch[1].trim() : "";

      console.log("Answer:", firstAnswer);

      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: generateFileName(),
      });

      const s3 = new S3Client({
        region: process.env.AWS_BUCKET_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const singedURL = await getSignedUrl(s3, putObjectCommand, {
        expiresIn: 60,
      });

      const ffmpeg = require("fluent-ffmpeg");

      ffmpeg()
        .input(input.video)
        .output("./templateOutput.mp4")
        .on("end", () => {
          console.log("Job done");
        })
        .on("error", (error: string) => {
          console.error("Error:", error);
        })
        .videoFilter([
          {
            filter: "drawtext",
            options: {
              text: joinedFirstQuestionAndChoices,
              fontsize: 75,
              fontcolor: "white",
              x: "(w-text_w)/2",
              y: "(h-text_h)/2",
              fontfile: "/Windows/fonts/calibrib.ttf",
              enable: `between(t,0,8)`,
            },
          },
          {
            filter: "drawtext",
            options: {
              text: firstAnswer,
              fontsize: 75,
              fontcolor: "white",
              x: "(w-text_w)/2",
              y: "(h-text_h)/2",
              fontfile: "/Windows/fonts/calibrib.ttf",
              enable: `between(t,8,9)`,
            },
          },
        ])
        .run();

      const createdVideo = await db.video.create({
        data: {
          name: "Test Name",
          url: singedURL.split("?")[0],
          key: singedURL,
          fileId: input.fileId,
        },
      });

      return createdVideo;
    }),

  getFileVideo: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input }) => {
      const videos = await db.video.findMany({
        where: {
          fileId: input.fileId,
        },
      });

      return videos;
    }),
});

export type AppRouter = typeof appRouter;
