import chefLogin from "../assets/login-chef.png";

export default function LoginButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="login-image-button"
      aria-label="Login"
    >
      <img
        src={chefLogin}
        alt="Login"
        className="login-image"
      />
    </button>
  );
}
