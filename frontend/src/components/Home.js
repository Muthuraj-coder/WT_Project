import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Welcome to Tracktendance</h1>
      <Link to="/signup">
        <button>Signup</button>
      </Link>
    </div>
  );
}

export default Home;
