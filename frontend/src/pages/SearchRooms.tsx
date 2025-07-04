import RoomSearch from "../components/RoomSearch";
import AppLayout from "../components/AppLayout";

const SearchRoomsPage = () => {
  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Search Rooms</h1>
        <RoomSearch />
      </div>
    </AppLayout>
  );
};

export default SearchRoomsPage;
