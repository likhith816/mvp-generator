/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminAuditLogs from "../adminAuditLogs.js";
import type * as apiUsageHistory from "../apiUsageHistory.js";
import type * as auth from "../auth.js";
import type * as billingTransactions from "../billingTransactions.js";
import type * as cleanup from "../cleanup.js";
import type * as migrations from "../migrations.js";
import type * as mvpPlans from "../mvpPlans.js";
import type * as populateTestData from "../populateTestData.js";
import type * as sampleData from "../sampleData.js";
import type * as sessions from "../sessions.js";
import type * as subscriptions from "../subscriptions.js";
import type * as systemSettings from "../systemSettings.js";
import type * as userSessions from "../userSessions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminAuditLogs: typeof adminAuditLogs;
  apiUsageHistory: typeof apiUsageHistory;
  auth: typeof auth;
  billingTransactions: typeof billingTransactions;
  cleanup: typeof cleanup;
  migrations: typeof migrations;
  mvpPlans: typeof mvpPlans;
  populateTestData: typeof populateTestData;
  sampleData: typeof sampleData;
  sessions: typeof sessions;
  subscriptions: typeof subscriptions;
  systemSettings: typeof systemSettings;
  userSessions: typeof userSessions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
