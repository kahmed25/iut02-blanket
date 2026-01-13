/**
 * API service for fetching data from backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ExcelData {
  success: boolean;
  data: {
    sheets: {
      [sheetName: string]: {
        type: string;
        columns?: string[];
        row_count?: number;
        data?: any[];
        summary?: any;
        raw_data?: any[];
      };
    };
    metadata: {
      file_name: string;
      sheet_count: number;
    };
  };
}

export interface ImageList {
  success: boolean;
  images: string[];
  base_url: string;
}

/**
 * Fetch Excel data from backend
 */
export async function fetchExcelData(): Promise<ExcelData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Excel data:', error);
    throw error;
  }
}

/**
 * Fetch list of available images
 */
export async function fetchImages(): Promise<ImageList> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

/**
 * Get image URL
 */
export function getImageUrl(filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}/images/${filename}`;
}

