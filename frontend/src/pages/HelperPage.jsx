import HelperChatContainer from "../components/HelperChatContainer";

const HelperPage = () => {
  return (
    <div className="h-screen pt-16">
      <div className="container mx-auto px-4 h-[calc(100vh-4rem)]">
        <div className="bg-base-100 rounded-lg shadow-sm h-full overflow-hidden">
          <HelperChatContainer />
        </div>
      </div>
    </div>
  );
};

export default HelperPage;