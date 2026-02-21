export interface Hostel {
    id: string;
    name: string;
    type: 'boys' | 'girls';
    capacity: number;
    facilities: string[];
    rector: string;
    rectorTitle: string;
    rectorPhone?: string;
}

export interface Notice {
    id: string;
    title: string;
    description: string;
    date: string;
    issuedBy: string;
    priority: 'normal' | 'important' | 'urgent';
    isNew: boolean;
    category: string;
}

export interface Student {
    id: string;
    name: string;
    enrollmentNo: string;
    hostelName: string;
    hostelType: 'boys' | 'girls';
    roomNo: string;
    floor: number;
    bedNumber: string;
    department: string;
    year: string;
    status: 'active' | 'on-leave' | 'exited';
    phone: string;
    email: string;
    dob: string;
    category: string;
    rollNo: string;
    admissionType: string;
    dateOfJoining: string;
    feeStatus: 'paid' | 'pending' | 'partial';
    parentName: string;
    parentRelation: string;
    parentContact: string;
    parentAddress: string;
    photoUrl: string;
    academicYear: string;
}

export interface Complaint {
    id: string;
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'resolved';
    createdAt: string;
    updatedAt: string;
    wardenRemark?: string;
}

export interface LeaveApplication {
    id: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
    destination: string;
    parentContact: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export interface RoomAsset {
    name: string;
    status: 'working' | 'damaged' | 'missing';
}

export interface Roommate {
    name: string;
    branch: string;
    year: string;
}

export interface MessMenu {
    id: string;
    hostelName: string;
    imageUrl: string;
    startDate: string;
    endDate: string;
    fees: string;
}

export type UserRole = 'student' | 'admin' | null;

export interface AuthState {
    isLoggedIn: boolean;
    role: UserRole;
    student: Student | null;
}
