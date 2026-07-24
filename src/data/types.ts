export interface Objective {
  label: string;
  actual: number;
  prev: number;
  target: number;
  unit: string;
  dec?: number;
}

export interface StatusItem {
  label: string;
  n: number;
  hint: string;
}

export interface NamedValue {
  name: string;
  val: number;
}

export interface SpotItem {
  label: string;
  val: number;
}

export interface NamedCount {
  name: string;
  n: number;
}

export interface CalendarMark {
  i: number;
  short: string;
  span?: number;
}

export interface Cohort {
  label: string;
  row: (number | null)[];
}

export interface TopicTrend {
  topic: string;
  n: number;
  trend: 'up' | 'down' | 'flat';
}

export interface FailureTopic {
  topic: string;
  n: number;
  note: string;
}

export interface ResponseType {
  name: string;
  val: number;
  zone: [number, number] | null;
}

export interface AdamData {
  meta: {
    university: string;
    universities: string[];
    pilot: string;
    range: string;
    updated: string;
    activeNow: number;
  };
  dates: string[];
  calendar: CalendarMark[];
  objectives: Objective[];
  users: {
    total: number;
    new7: number;
    newToday: number;
    signups: number[];
    status: StatusItem[];
    byFaculty: NamedCount[];
    byResidency: NamedValue[];
    byLanguage: NamedValue[];
    byYear: NamedValue[];
  };
  usage: {
    dau: number;
    wau: number;
    mau: number;
    dauSeries: number[];
    wauSeries: number[];
    mauSeries: number[];
    retentionD7: number;
    retentionD7Prev: number;
    retentionD30: number;
    retentionD30Prev: number;
    stickiness: number;
    sessionsPerUser: number;
    questionsPerUser: number;
    engagementRate: number;
    cohorts: Cohort[];
    topFeatures: NamedValue[];
    conversations: {
      perDay: number[];
      total: number;
      avgLength: number;
      byCategory: NamedValue[];
    };
  };
  quality: {
    satisfaction: number;
    satisfactionPrev: number;
    firstResolution: number;
    firstResolutionPrev: number;
    fallbackRate: number;
    fallbackPrev: number;
    csatSeries: number[];
    responseTypes: ResponseType[];
    topTopics: TopicTrend[];
    failures: FailureTopic[];
  };
  spot: SpotItem[];
  filters: {
    faculty: string[];
    period: string[];
  };
}
