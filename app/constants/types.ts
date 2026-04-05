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
    _id?: string;
    id: string;
    title: string;
    description: string;
    date: string;
    issuedBy: string;
    priority: 'normal' | 'important' | 'urgent';
    isNew?: boolean;
    category: string;
    hostelName: string;
    isActive?: boolean;
    fileUrl?: string;
    fileName?: string;
    createdAt?: string;
}

export interface Student {
    _id: string;
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
    status: 'active' | 'on-leave' | 'exited' | 'pending' | 'past';
    phone: string;
    email: string;
    category: string;
    rollNo: string;
    isRoomAllocated: boolean;
    dateOfJoining: string;
    feeStatus: 'paid' | 'pending' | 'partial';
    parentName: string;
    parentRelation: string;
    parentContact: string;
    parentAddress: string;
    photoUrl: string;
    dob?: string;
    admissionType?: string;
    gender: 'Male' | 'Female' | 'Other';
    prevMarks: string;
    distance: string;
    academicYear: string;
}

export interface Complaint {
    _id?: string;
    id: string;
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'resolved';
    createdAt: string;
    updatedAt: string;
    wardenRemark?: string;
    studentName?: string;
    studentEnrollment?: string;
    hostelName?: string;
    roomNumber?: string;
    imageUrl?: string;
}

export interface LeaveApplication {
    id: string;
    studentId: string;
    studentName: string;
    studentYear: string;
    hostelName: string;
    roomNo: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
    destination: string;
    parentContact: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    rejectionReason?: string;
    qrCodeToken?: string;
    leaveCount?: number;
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

export type UserRole = 'student' | 'admin' | 'rector' | 'contractor' | 'watchman' | null;

export interface AuthState {
    isLoggedIn: boolean;
    role: UserRole;
    student: Student | null;
}

export interface Admission {
    id: string;
    fullName: string;
    enrollment: string;
    email: string;
    phone: string;
    department: string;
    prevMarks: string;
    distance: string;
    parentName: string;
    category: string;
    gender: 'male' | 'female' | 'other';
    year: '1st' | '2nd' | '3rd';
    photoUrl?: string;
    additionalData: Record<string, any>;
    status: 'pending' | 'verified' | 'accepted' | 'rejected' | 'past';
    appliedAt: string;
    studentPassword?: string;
    isRoomAllocated?: boolean;
    allocatedHostel?: string;
    allocatedRoom?: string;
    allocatedBed?: number | string;
}

export interface HostelExit {
    _id: string;
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    hostelName: string;
    roomNo: string;
    bedNumber: string;
    exitDate: string;
    reason: string;
    exitAssets: { name: string, count: number, damagedCount: number, condition: string }[];
    status: 'pending' | 'approved' | 'rejected';
    wardenRemark: string;
    createdAt: string;
}
