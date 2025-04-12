export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return '#FFA726'; // Orange
    case 'IN_PROGRESS':
      return '#42A5F5'; // Blue
    case 'RESOLVED':
      return '#66BB6A'; // Green
    case 'CANCELLED':
      return '#E57373'; // Red
    default:
      return '#9E9E9E'; // Grey
  }
} 