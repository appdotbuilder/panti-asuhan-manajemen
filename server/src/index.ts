
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import {
  createUserInputSchema,
  createChildInputSchema,
  updateChildInputSchema,
  createDonorInputSchema,
  createDonationInputSchema,
  getDonationsByDateRangeSchema,
  createExpenseInputSchema,
  getExpensesByDateRangeSchema,
  createActivityInputSchema,
  updateActivityInputSchema,
  getActivitiesByDateRangeSchema,
} from './schema';
import { createUser } from './handlers/create_user';
import { createChild } from './handlers/create_child';
import { getChildren } from './handlers/get_children';
import { updateChild } from './handlers/update_child';
import { createDonor } from './handlers/create_donor';
import { getDonors } from './handlers/get_donors';
import { createDonation } from './handlers/create_donation';
import { getDonationsByDateRange } from './handlers/get_donations_by_date_range';
import { createExpense } from './handlers/create_expense';
import { getExpensesByDateRange } from './handlers/get_expenses_by_date_range';
import { createActivity } from './handlers/create_activity';
import { getActivitiesByDateRange } from './handlers/get_activities_by_date_range';
import { updateActivity } from './handlers/update_activity';
import { getFinancialReport } from './handlers/get_financial_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Child management
  createChild: publicProcedure
    .input(createChildInputSchema)
    .mutation(({ input }) => createChild(input)),
  getChildren: publicProcedure
    .query(() => getChildren()),
  updateChild: publicProcedure
    .input(updateChildInputSchema)
    .mutation(({ input }) => updateChild(input)),

  // Donor management
  createDonor: publicProcedure
    .input(createDonorInputSchema)
    .mutation(({ input }) => createDonor(input)),
  getDonors: publicProcedure
    .query(() => getDonors()),

  // Donation management
  createDonation: publicProcedure
    .input(createDonationInputSchema)
    .mutation(({ input }) => createDonation(input)),
  getDonationsByDateRange: publicProcedure
    .input(getDonationsByDateRangeSchema)
    .query(({ input }) => getDonationsByDateRange(input)),

  // Expense management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),
  getExpensesByDateRange: publicProcedure
    .input(getExpensesByDateRangeSchema)
    .query(({ input }) => getExpensesByDateRange(input)),

  // Activity management
  createActivity: publicProcedure
    .input(createActivityInputSchema)
    .mutation(({ input }) => createActivity(input)),
  getActivitiesByDateRange: publicProcedure
    .input(getActivitiesByDateRangeSchema)
    .query(({ input }) => getActivitiesByDateRange(input)),
  updateActivity: publicProcedure
    .input(updateActivityInputSchema)
    .mutation(({ input }) => updateActivity(input)),

  // Financial reporting
  getFinancialReport: publicProcedure
    .input(getDonationsByDateRangeSchema)
    .query(({ input }) => getFinancialReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
