const Template1 = () => {
  return (
    <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
        {/* Left sidebar & main wrapper */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            Template 2
          </div>
        </div>

        <div className="shrink-0 flex-[0.95] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0 flex justify-center items-center">
          Main Wrapper
        </div>
      </div>
    </div>
  );
};

export default Template1;
