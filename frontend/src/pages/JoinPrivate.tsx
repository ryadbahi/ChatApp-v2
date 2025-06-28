const JoinPrivate = () => {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Join Private Room</h2>
      <input
        type="password"
        placeholder="Enter room password"
        className="border p-2 rounded w-full mb-4"
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Join</button>
    </div>
  );
};

export default JoinPrivate;
