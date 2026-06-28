import { apiRequest } from "./api";

const StoreService = {
  listCategories: () => apiRequest("get", "/api/store/categories"),
  listItems: (params = {}) => apiRequest("get", "/api/store/items", undefined, params),
  getInventory: () => apiRequest("get", "/api/store/inventory"),
  getTransactions: () => apiRequest("get", "/api/store/transactions"),
  purchaseItem: (payload) => apiRequest("post", "/api/store/purchase", payload),
  verifyEthPurchase: (payload) => apiRequest("post", "/api/store/purchase/verify", payload),
  equipItem: (payload) => apiRequest("post", "/api/store/equip", payload),
};

export default StoreService;
