import express from "express";
import { protectAdmin, requirePermission } from "../middleware/adminAuth.js";

// Controllers
import { adminLogin, getAdminProfile } from "../controllers/adminAuthController.js";
import { getDashboardOverview } from "../controllers/adminDashboardController.js";
import {
  listOwners,
  getOwner,
  approveOwner,
  rejectOwner,
  suspendOwner,
  reactivateOwner,
} from "../controllers/adminOwnerController.js";
import {
  listFields,
  getField,
  approveField,
  rejectField,
  disableField,
  blockField,
  editField,
} from "../controllers/adminFieldController.js";
import {
  listBookings,
  getBooking,
  updateBookingStatus,
  handleDispute,
} from "../controllers/adminBookingController.js";
import {
  getCommissionRate,
  updateCommissionRate,
  getTransactions,
  getFinancialOverview,
} from "../controllers/adminFinancialController.js";
import {
  getBanners, createBanner, updateBanner, deleteBanner,
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getCategories, createCategory, updateCategory, deleteCategory,
  getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  getHomepageContent, updateHomepageContent,
  getFooterContent, updateFooterContent,
} from "../controllers/adminCMSController.js";
import {
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  sendBroadcast,
  getNotificationLogs,
} from "../controllers/adminNotificationController.js";
import {
  getSettings, updateSettings,
  getGatewaySettings, updateGatewaySettings,
  getCities, createCity, updateCity, deleteCity,
  addArea, removeArea,
} from "../controllers/adminSettingsController.js";
import { getActivityLogs, getActivityLog } from "../controllers/adminActivityController.js";

const router = express.Router();

// ============================================================
// AUTH ROUTES (PUBLIC)
// ============================================================
router.post("/auth/login", adminLogin);

// ============================================================
// PROTECTED ROUTES - All require admin authentication
// ============================================================
router.use(protectAdmin);

// Profile
router.get("/auth/profile", getAdminProfile);

// ============================================================
// DASHBOARD
// ============================================================
router.get("/dashboard/overview", requirePermission("view_dashboard"), getDashboardOverview);

// ============================================================
// OWNERS
// ============================================================
router.get("/owners", requirePermission("view_dashboard"), listOwners);
router.get("/owners/:id", requirePermission("view_dashboard"), getOwner);
router.put("/owners/:id/approve", requirePermission("approve_owner"), approveOwner);
router.put("/owners/:id/reject", requirePermission("reject_owner"), rejectOwner);
router.put("/owners/:id/suspend", requirePermission("suspend_owner"), suspendOwner);
router.put("/owners/:id/reactivate", requirePermission("reactivate_owner"), reactivateOwner);

// ============================================================
// FIELDS
// ============================================================
router.get("/fields", requirePermission("view_dashboard"), listFields);
router.get("/fields/:id", requirePermission("view_dashboard"), getField);
router.put("/fields/:id/approve", requirePermission("approve_field"), approveField);
router.put("/fields/:id/reject", requirePermission("reject_field"), rejectField);
router.put("/fields/:id/disable", requirePermission("disable_field"), disableField);
router.put("/fields/:id/block", requirePermission("block_field"), blockField);
router.put("/fields/:id", requirePermission("edit_field"), editField);

// ============================================================
// BOOKINGS
// ============================================================
router.get("/bookings", requirePermission("view_bookings"), listBookings);
router.get("/bookings/:id", requirePermission("view_bookings"), getBooking);
router.put("/bookings/:id/status", requirePermission("update_booking"), updateBookingStatus);
router.put("/bookings/:id/dispute", requirePermission("handle_dispute"), handleDispute);

// ============================================================
// FINANCIAL
// ============================================================
router.get("/financial/overview", requirePermission("view_financial"), getFinancialOverview);
router.get("/financial/commission", requirePermission("view_financial"), getCommissionRate);
router.put("/financial/commission", requirePermission("update_commission"), updateCommissionRate);
router.get("/financial/transactions", requirePermission("view_financial"), getTransactions);

// ============================================================
// CMS
// ============================================================
// Banners
router.get("/cms/banners", requirePermission("view_dashboard"), getBanners);
router.post("/cms/banners", requirePermission("manage_cms"), createBanner);
router.put("/cms/banners/:id", requirePermission("manage_cms"), updateBanner);
router.delete("/cms/banners/:id", requirePermission("manage_cms"), deleteBanner);

// FAQs
router.get("/cms/faqs", requirePermission("view_dashboard"), getFAQs);
router.post("/cms/faqs", requirePermission("manage_cms"), createFAQ);
router.put("/cms/faqs/:id", requirePermission("manage_cms"), updateFAQ);
router.delete("/cms/faqs/:id", requirePermission("manage_cms"), deleteFAQ);

// Categories
router.get("/cms/categories", requirePermission("view_dashboard"), getCategories);
router.post("/cms/categories", requirePermission("manage_cms"), createCategory);
router.put("/cms/categories/:id", requirePermission("manage_cms"), updateCategory);
router.delete("/cms/categories/:id", requirePermission("manage_cms"), deleteCategory);

// Promo Codes
router.get("/cms/promo-codes", requirePermission("view_dashboard"), getPromoCodes);
router.post("/cms/promo-codes", requirePermission("manage_cms"), createPromoCode);
router.put("/cms/promo-codes/:id", requirePermission("manage_cms"), updatePromoCode);
router.delete("/cms/promo-codes/:id", requirePermission("manage_cms"), deletePromoCode);

// Homepage Content
router.get("/cms/homepage", requirePermission("view_dashboard"), getHomepageContent);
router.put("/cms/homepage", requirePermission("manage_cms"), updateHomepageContent);

// Footer Content
router.get("/cms/footer", requirePermission("view_dashboard"), getFooterContent);
router.put("/cms/footer", requirePermission("manage_cms"), updateFooterContent);

// ============================================================
// NOTIFICATIONS
// ============================================================
router.get("/notifications/templates", requirePermission("view_notifications"), getTemplates);
router.post("/notifications/templates", requirePermission("manage_templates"), createTemplate);
router.put("/notifications/templates/:id", requirePermission("manage_templates"), updateTemplate);
router.delete("/notifications/templates/:id", requirePermission("manage_templates"), deleteTemplate);
router.post("/notifications/broadcast", requirePermission("send_broadcast"), sendBroadcast);
router.get("/notifications/logs", requirePermission("view_notifications"), getNotificationLogs);

// ============================================================
// SETTINGS
// ============================================================
router.get("/settings", requirePermission("view_settings"), getSettings);
router.put("/settings", requirePermission("update_settings"), updateSettings);
router.get("/settings/gateway", requirePermission("view_settings"), getGatewaySettings);
router.put("/settings/gateway", requirePermission("update_settings"), updateGatewaySettings);

// Cities / Areas
router.get("/settings/cities", requirePermission("view_settings"), getCities);
router.post("/settings/cities", requirePermission("manage_cities"), createCity);
router.put("/settings/cities/:id", requirePermission("manage_cities"), updateCity);
router.delete("/settings/cities/:id", requirePermission("manage_cities"), deleteCity);
router.post("/settings/cities/:cityId/areas", requirePermission("manage_cities"), addArea);
router.delete("/settings/cities/:cityId/areas/:areaId", requirePermission("manage_cities"), removeArea);

// ============================================================
// ACTIVITY LOGS
// ============================================================
router.get("/activity", requirePermission("view_activity"), getActivityLogs);
router.get("/activity/:id", requirePermission("view_activity"), getActivityLog);

export default router;

