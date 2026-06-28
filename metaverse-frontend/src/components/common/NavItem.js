import { Link } from "react-router-dom";

const NavItem = ({ to, title, addClass = "", onClick }) => (
  <div>
    <Link
      to={to}
      onClick={onClick}
      className={`my-2 block text-lg font-normal hover:font-bold hover:text-[#0F7BDE] md:my-5 md:ml-6 md:inline-block ${addClass}`}
    >
      {title}
    </Link>
  </div>
);

export default NavItem;
