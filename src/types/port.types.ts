export interface PortEntry {
    formatted: string;
    port_name: string;
    location: string;
    country: string;
    valid: boolean;
  }
  
  export interface ProcessFileResponse {
    message: string;
    csvPath: string;
    txtPath: string;
  }
  