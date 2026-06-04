import { toast } from "react-toastify";

export const ShowSuccessMessage = (message) => {
  if (message) {
    toast.success(message, {
      position: "top-right",
    });
  } else {
    toast.success("Success", {
      position: "top-right",
    });
  }
};

export const ShowErrorMessage = (message) => {
  if (message) {
    toast.error(message, {
      position: "top-right",
    });
  } else {
    toast.error("Error", {
      position: "top-right",
    });
  }
};
