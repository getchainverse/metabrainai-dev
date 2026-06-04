import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
const NavItem = ({ to, title }) => {
  return (
    <div>
      <Link
        to={to}
        className="my-5 ml-12 block text-lg font-normal hover:font-bold hover:text-back-red md:inline-block"
      >
        {title}
      </Link>
    </div>
  );
};

export default NavItem;
