export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  tags: string[];
  customFields: Record<string, string>;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLOpportunity {
  id: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface GHLAppointment {
  id: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'booked' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
}

export interface GHLWebhookPayload {
  type: string;
  locationId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface GHLWebhookEvent {
  event:
    | 'ContactCreate'
    | 'ContactUpdate'
    | 'ContactDelete'
    | 'OpportunityCreate'
    | 'OpportunityUpdate'
    | 'OpportunityDelete'
    | 'AppointmentCreate'
    | 'AppointmentUpdate'
    | 'AppointmentDelete';
  payload: GHLWebhookPayload;
  receivedAt: string;
}

export interface GHLApiClient {
  findContactByPhone(phone: string): Promise<GHLContact | null>;
  findContactByEmail(email: string): Promise<GHLContact | null>;
  createContact(contact: Omit<GHLContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<GHLContact>;
  updateContact(id: string, fields: Partial<GHLContact>): Promise<GHLContact>;
  getOpportunities(contactId: string): Promise<GHLOpportunity[]>;
  createOpportunity(opportunity: Omit<GHLOpportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GHLOpportunity>;
  getPipelines(): Promise<GHLPipeline[]>;
  parseWebhook(body: unknown, signature?: string): Promise<GHLWebhookEvent>;
}

export interface GHLEngineConfig {
  apiKey?: string;
  locationId: string;
  webhookSecret?: string;
}

export interface GHLEngine {
  getClient(): GHLApiClient | null;
  initialize(config: GHLEngineConfig): Promise<void>;
}
