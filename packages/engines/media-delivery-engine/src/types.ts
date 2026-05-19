export type MediaType = 'image' | 'pdf' | 'audio' | 'video' | 'document';

export type MediaChannel = 'whatsapp' | 'email' | 'web' | 'sms';

export type MediaStatus = 'pending' | 'uploading' | 'ready' | 'sending' | 'delivered' | 'viewed' | 'expired' | 'failed';

export interface MediaAsset {
  id: string;
  type: MediaType;
  mimeType: string;
  filename: string;
  sizeBytes: number;
  url?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface MediaDeliveryRequest {
  id: string;
  assetId: string;
  channel: MediaChannel;
  to: string;
  caption?: string;
  idempotencyKey: string;
  scheduledAt?: string;
  context?: Record<string, unknown>;
}

export interface MediaReceipt {
  requestId: string;
  assetId: string;
  channel: MediaChannel;
  status: MediaStatus;
  deliveredAt?: string;
  viewedAt?: string;
  channelReceiptId?: string;
  error?: string;
}

export interface MediaUploadOptions {
  maxSizeBytes: number;
  allowedTypes: MediaType[];
  presignedUrlExpirySeconds: number;
}

export interface MediaProvider {
  readonly channel: MediaChannel;
  readonly supportedTypes: MediaType[];
  upload(asset: Omit<MediaAsset, 'id' | 'url' | 'createdAt'>, buffer: Buffer): Promise<MediaAsset>;
  send(request: MediaDeliveryRequest, asset: MediaAsset): Promise<MediaReceipt>;
  getStatus(requestId: string): Promise<MediaReceipt>;
}

export interface MediaDeliveryEngineConfig {
  defaultExpirySeconds: number;
  maxFileSizeBytes: number;
  uploadOptions: MediaUploadOptions;
}

export interface MediaDeliveryEngine {
  upload(asset: Omit<MediaAsset, 'id' | 'url' | 'createdAt'>, buffer: Buffer): Promise<MediaAsset>;
  send(request: MediaDeliveryRequest): Promise<MediaReceipt>;
  registerProvider(provider: MediaProvider): void;
}
