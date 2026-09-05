export type ReportingStats = {
  activeEmployees: number;
  postsThisMonth: number;
  activeChannels: number;
};

// Generic "label + count" shape shared by Department, Business Unit,
// and Country engagement — one type, one chart component, instead of
// three near-identical ones.
export type EngagementBreakdown = {
  label: string;
  postCount: number;
};

export type CountryHeadcount = {
  countryName: string;
  employeeCount: number;
};