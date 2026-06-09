import { config } from "@/lib/config";
import * as local from "./local-database";
import * as supabase from "./supabase-database";

const backend = config.useSupabaseStore ? supabase : local;

export const getChannels = backend.getChannels;
export const getChannel = backend.getChannel;
export const upsertChannel = backend.upsertChannel;
export const deleteChannel = local.deleteChannel;
export const getContent = backend.getContent;
export const getContentById = backend.getContentById;
export const saveContent = backend.saveContent;
export const deleteContent = backend.deleteContent;
export const duplicateContent = backend.duplicateContent;
export const getSources = backend.getSources;
export const saveSource = backend.saveSource;
export const getMetrics = backend.getMetrics;
export const saveMetrics = backend.saveMetrics;
export const getTrends = backend.getTrends;
export const saveTrends = backend.saveTrends;
export const getJobs = backend.getJobs;
export const addJob = backend.addJob;
export const updateJob = backend.updateJob;
export const getPendingJobs = backend.getPendingJobs;
export const saveBlastOperation = backend.saveBlastOperation;
export const recordFootageUsage = backend.recordFootageUsage;
export const getFootageUsageIds = backend.getFootageUsageIds;
export const getReviewQueue = backend.getReviewQueue;
export const getScheduledContent = backend.getScheduledContent;
export const addEvergreenContent = backend.addEvergreenContent;
export const getEvergreenQueue = local.getEvergreenQueue;
export const removeEvergreen = local.removeEvergreen;
export const getNotifications = local.getNotifications;

export { generateId } from "./local-store";
