import Reset from "../../components/auth/Reset";
import Header from "../../components/Header";
import { useParams } from "react-router-dom";

const ResetPage = () => {
  const routeParams = useParams();
  console.log("routeParams", routeParams);
  return (
    <>
      <Header />
      <Reset id={routeParams.id} token={routeParams.token} />
    </>
  );
};

export default ResetPage;
