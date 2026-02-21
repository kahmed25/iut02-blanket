/**
 * Fund Management API service for Phase 5
 * Handles projects, contributions, statistics, settings, and user management
 */

import { tokenService } from '@/auth/services/tokenService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============ Types ============

export interface Project {
  project_id: string;
  name: string;
  description: string;
  target_amount: number;
  target_currency: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  target_amount: number;
  target_currency?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  target_amount?: number;
  target_currency?: string;
  status?: 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
}

export interface Contribution {
  contribution_id: string;
  project_id: string;
  contributor_name: string;
  user_id?: string;
  amount: number;
  currency: string;
  payment_mode: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  entry_type: 'manual' | 'online';
  collection_notes?: string;
  entered_by: string;
  stripe_payment_id?: string;
  contribution_date: string;
  created_at: string;
  updated_at: string;
}

export interface ContributionCreate {
  project_id: string;
  contributor_name: string;
  amount: number;
  currency?: string;
  payment_mode: string;
  payment_status?: string;
  collection_notes?: string;
  contribution_date?: string;
}

export interface ContributionUpdate {
  contributor_name?: string;
  amount?: number;
  currency?: string;
  payment_mode?: string;
  payment_status?: string;
  collection_notes?: string;
  contribution_date?: string;
}

export interface ProjectStats {
  project?: any;
  total_raised: number;
  total_contributions: number;
  unique_contributors: number;
  target_amount: number;
  target_currency: string;
  progress_percentage: number;
}

export interface ContributionsByDate {
  date: string;
  count: number;
  total: number;
}

export interface ContributionsByMode {
  payment_mode: string;
  count: number;
  total: number;
}

export interface AppSettings {
  data_source_mode: 'excel' | 'dynamic';
  default_currency: string;
  email_notifications_enabled: string;
  [key: string]: string;
}

export interface UserWithRole {
  user_id: string;
  email: string;
  username?: string;
  provider: string;
  role: 'super_admin' | 'admin' | 'fund_admin' | 'user';
  assigned_projects: string[];
  created_at: string;
  last_login: string;
}

export interface ConfigResponse {
  currencies: string[];
  payment_modes: string[];
  roles: string[];
}

// Phase 6: Media types
export interface Media {
  media_id: string;
  project_id: string;
  media_type: 'image' | 'video' | 'audio';
  file_name: string;
  file_key: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  display_order: number;
  uploaded_by: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface MediaCounts {
  image: number;
  video: number;
  audio: number;
  total: number;
}

export interface MediaUpdate {
  caption?: string;
  display_order?: number;
}

export interface MediaSupportedTypes {
  [key: string]: {
    extensions: string[];
    max_size_bytes: number;
    max_size_mb: number;
  };
}

// Phase 7: Distribution types
export interface Distribution {
  distribution_id: string;
  project_id: string;
  institution_type: string;
  institution_name: string;
  distributed_amount: number;
  currency: string;
  proof_file_key?: string;
  proof_file_name?: string;
  notes?: string;
  distributed_by: string;
  distribution_date: string;
  created_at: string;
  updated_at: string;
}

export interface DistributionCreate {
  project_id: string;
  institution_type: string;
  institution_name: string;
  distributed_amount: number;
  currency?: string;
  distribution_date: string;
  notes?: string;
}

export interface DistributionUpdate {
  institution_type?: string;
  institution_name?: string;
  distributed_amount?: number;
  currency?: string;
  distribution_date?: string;
  notes?: string;
}

export interface DistributionStats {
  total_distributions: number;
  total_distributed: number;
  unique_institutions: number;
}

// Project Import types
export interface ImportPreviewContribution {
  row: number;
  contributor_name: string;
  amount: number;
  payment_mode: string;
  payment_status: string;
  contribution_date: string;
  notes: string;
  errors: string[];
  valid: boolean;
}

export interface ImportPreviewDistribution {
  row: number;
  institution_type: string;
  institution_name: string;
  amount: number;
  currency: string;
  distribution_date: string;
  notes: string;
  errors: string[];
  valid: boolean;
}

export interface ImportPreviewResponse {
  success: boolean;
  project: {
    name: string;
    description?: string;
    target_amount: number;
    currency: string;
    status: string;
  };
  contributions: ImportPreviewContribution[];
  distributions: ImportPreviewDistribution[];
  summary: {
    total_contributions: number;
    valid_contributions: number;
    invalid_contributions: number;
    contributions_amount: number;
    total_distributions: number;
    valid_distributions: number;
    invalid_distributions: number;
    distributions_amount: number;
  };
  validation_errors: string[];
  contributions_errors: string[];
  distributions_errors: string[];
  is_valid: boolean;
}

export interface ImportResponse {
  success: boolean;
  project: Project;
  contributions_created: number;
  contributions_errors: string[];
  distributions_created: number;
  distributions_errors: string[];
  message: string;
}

// ============ Helper Functions ============

function getAuthHeaders(): HeadersInit {
  const token = tokenService.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    // Handle various error response formats
    let errorMessage = `API Error: ${response.status}`;
    if (errorData.detail) {
      // detail could be a string or an object (e.g., validation errors)
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // FastAPI validation errors are arrays of objects with msg field
        errorMessage = errorData.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof errorData.detail === 'object') {
        errorMessage = errorData.detail.msg || errorData.detail.message || JSON.stringify(errorData.detail);
      }
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ============ Projects API ============

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const response = await fetch(`${API_URL}/api/projects`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ projects: Project[] }>(response);
    return data.projects;
  },

  async getById(projectId: string): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Project>(response);
  },

  async create(project: ProjectCreate): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project),
    });
    return handleResponse<Project>(response);
  },

  async update(projectId: string, updates: ProjectUpdate): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<Project>(response);
  },

  async delete(projectId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
  },

  // Import methods
  async importProject(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/api/projects/import`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse<ImportResponse>(response);
  },

  async previewImport(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/api/projects/import/preview`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse<ImportPreviewResponse>(response);
  },

  getTemplateUrl(withExample: boolean = false): string {
    return `${API_URL}/api/projects/import/template?with_example=${withExample}`;
  },
};

// ============ Contributions API ============

export const contributionsApi = {
  async getAll(projectId: string): Promise<Contribution[]> {
    const url = `${API_URL}/api/contributions/${projectId}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ contributions: Contribution[] }>(response);
    return data.contributions;
  },

  async getById(contributionId: string): Promise<Contribution> {
    const response = await fetch(`${API_URL}/api/contributions/${contributionId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Contribution>(response);
  },

  async create(contribution: ContributionCreate): Promise<Contribution> {
    const response = await fetch(`${API_URL}/api/contributions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contribution),
    });
    return handleResponse<Contribution>(response);
  },

  async update(contributionId: string, updates: ContributionUpdate): Promise<Contribution> {
    const response = await fetch(`${API_URL}/api/contributions/${contributionId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<Contribution>(response);
  },

  async delete(contributionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/contributions/${contributionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
  },
};

// ============ Statistics API ============

export const statsApi = {
  async getSummary(): Promise<{ projects: ProjectStats[]; total_projects: number; total_contributions: number; total_amount: number }> {
    const response = await fetch(`${API_URL}/api/stats/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const response = await fetch(`${API_URL}/api/stats/${projectId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ stats: ProjectStats }>(response);
    return data.stats;
  },

  async getContributionsByDate(projectId: string, startDate?: string, endDate?: string): Promise<ContributionsByDate[]> {
    let url = `${API_URL}/api/stats/${projectId}/by-date`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ data: ContributionsByDate[] }>(response);
    return data.data || [];
  },

  async getContributionsByMode(projectId: string): Promise<ContributionsByMode[]> {
    const response = await fetch(`${API_URL}/api/stats/${projectId}/by-mode`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ data: ContributionsByMode[] }>(response);
    return data.data || [];
  },
};

// ============ Settings API ============

export const settingsApi = {
  async get(): Promise<AppSettings> {
    const response = await fetch(`${API_URL}/api/settings`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ settings: AppSettings }>(response);
    return data.settings;
  },

  async update(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await handleResponse<{ settings: AppSettings }>(response);
    return data.settings;
  },
};

// ============ User Management API ============

export const usersApi = {
  async getAll(): Promise<UserWithRole[]> {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ users: UserWithRole[] }>(response);
    return data.users;
  },

  async updateRole(userId: string, role: string): Promise<UserWithRole> {
    const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse<UserWithRole>(response);
  },

  async assignProject(userId: string, projectId: string): Promise<UserWithRole> {
    const response = await fetch(`${API_URL}/api/users/${userId}/assign-project`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId }),
    });
    const data = await handleResponse<{ success: boolean; message: string; user: UserWithRole }>(response);
    return data.user;
  },

  async unassignProject(userId: string, projectId: string): Promise<UserWithRole> {
    const response = await fetch(`${API_URL}/api/users/${userId}/unassign-project?project_id=${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ success: boolean; message: string; user: UserWithRole }>(response);
    return data.user;
  },
};

// ============ Config API (Public) ============

export const configApi = {
  async getCurrencies(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/config/currencies`);
    const data = await handleResponse<{ currencies: string[] }>(response);
    return data.currencies;
  },

  async getPaymentModes(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/config/payment-modes`);
    const data = await handleResponse<{ payment_modes: string[] }>(response);
    return data.payment_modes;
  },

  async getRoles(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/config/roles`);
    const data = await handleResponse<{ roles: string[] }>(response);
    return data.roles;
  },

  async getAll(): Promise<ConfigResponse> {
    const [currencies, payment_modes, roles] = await Promise.all([
      this.getCurrencies(),
      this.getPaymentModes(),
      this.getRoles(),
    ]);
    return { currencies, payment_modes, roles };
  },
};

// ============ Media API (Phase 6) ============

export const mediaApi = {
  async upload(projectId: string, file: File, caption?: string): Promise<Media> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/api/media`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await handleResponse<{ media: Media }>(response);
    return data.media;
  },

  async getByProject(projectId: string, mediaType?: 'image' | 'video' | 'audio'): Promise<{ media: Media[]; counts: MediaCounts }> {
    let url = `${API_URL}/api/media/project/${projectId}`;
    if (mediaType) {
      url += `?media_type=${mediaType}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ media: Media[]; counts: MediaCounts }>(response);
  },

  async getById(mediaId: string): Promise<Media> {
    const response = await fetch(`${API_URL}/api/media/${mediaId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ media: Media }>(response);
    return data.media;
  },

  async update(mediaId: string, updates: MediaUpdate): Promise<Media> {
    const response = await fetch(`${API_URL}/api/media/${mediaId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await handleResponse<{ media: Media }>(response);
    return data.media;
  },

  async delete(mediaId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/media/${mediaId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
  },

  async reorder(projectId: string, items: { media_id: string; display_order: number }[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/media/reorder/${projectId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
  },

  async getSupportedTypes(): Promise<MediaSupportedTypes> {
    const response = await fetch(`${API_URL}/api/media/config/supported`);
    const data = await handleResponse<{ supported_types: MediaSupportedTypes }>(response);
    return data.supported_types;
  },

  getFileUrl(fileKey: string): string {
    return `${API_URL}/uploads/${fileKey}`;
  },

  getMediaFileUrl(mediaId: string): string {
    return `${API_URL}/api/media/file/${mediaId}`;
  },
};

// ============ Distributions API (Phase 7) ============

export const distributionsApi = {
  async getAll(projectId: string): Promise<Distribution[]> {
    const response = await fetch(`${API_URL}/api/distributions/${projectId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ distributions: Distribution[] }>(response);
    return data.distributions;
  },

  async getById(distributionId: string): Promise<Distribution> {
    const response = await fetch(`${API_URL}/api/distribution/${distributionId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ distribution: Distribution }>(response);
    return data.distribution;
  },

  async getStats(projectId: string): Promise<DistributionStats> {
    const response = await fetch(`${API_URL}/api/distributions/stats/${projectId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ stats: DistributionStats }>(response);
    return data.stats;
  },

  async create(distribution: DistributionCreate): Promise<Distribution> {
    const response = await fetch(`${API_URL}/api/distributions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(distribution),
    });
    const data = await handleResponse<{ distribution: Distribution }>(response);
    return data.distribution;
  },

  async update(distributionId: string, updates: DistributionUpdate): Promise<Distribution> {
    const response = await fetch(`${API_URL}/api/distributions/${distributionId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await handleResponse<{ distribution: Distribution }>(response);
    return data.distribution;
  },

  async uploadProof(distributionId: string, file: File): Promise<Distribution> {
    const formData = new FormData();
    formData.append('file', file);

    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/api/distributions/${distributionId}/proof`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await handleResponse<{ distribution: Distribution }>(response);
    return data.distribution;
  },

  async delete(distributionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/distributions/${distributionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
  },

  getProofUrl(fileKey: string): string {
    return `${API_URL}/uploads/${fileKey}`;
  },
};

// ============ Config API additions ============

const configApiExtended = {
  ...configApi,
  async getInstitutionTypes(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/config/institution-types`);
    const data = await handleResponse<{ institution_types: string[] }>(response);
    return data.institution_types;
  },
};

// ============ Export all APIs ============

export const fundApi = {
  projects: projectsApi,
  contributions: contributionsApi,
  stats: statsApi,
  settings: settingsApi,
  users: usersApi,
  config: configApiExtended,
  media: mediaApi,
  distributions: distributionsApi,
};

export default fundApi;
