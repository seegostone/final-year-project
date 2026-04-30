// services/taskService.js
export const mockTasks = [
  {
    _id: 'task_001',
    trackingId: 'CMS-2026-001',
    complaintId: 'comp_001',
    title: 'Power outage in Block A - Complete electrical failure',
    description: 'Complete power failure in Block A, affecting 5 floors. Emergency lights working but no power to sockets.',
    location: 'Block A, Floor 2-5',
    zone: 'Main Campus',
    category: 'electrical',
    urgency: 'critical',
    status: 'in-progress',
    assignedBy: {
      name: 'Robert Estates Officer',
      email: 'robert@estates.mak.ac.ug'
    },
    assignedAt: '2026-04-29T08:30:00',
    deadline: '2026-04-30T17:00:00',
    workReports: [
      {
        id: 'wr_001',
        status: 'in-progress',
        actionsTaken: 'Inspected main circuit breaker panel. Found tripped main breaker.',
        materialsUsed: [
          { name: 'Circuit Breaker Tester', quantity: 1, cost: 0 },
          { name: 'Safety Gloves', quantity: 1, cost: 0 }
        ],
        hoursSpent: 1.5,
        reportedBy: 'Robert Mukiibi',
        reportedAt: '2026-04-29T10:00:00',
        notes: 'Will need replacement parts. Currently assessing cause of trip.'
      }
    ]
  },
  {
    _id: 'task_002',
    trackingId: 'CMS-2026-002',
    complaintId: 'comp_002',
    title: 'Leaking pipe in Staff Residence - Water flooding',
    description: 'Water pipe burst in kitchen, flooding the entire floor. Water still flowing.',
    location: 'Staff Residence, Room 12',
    zone: 'East Campus',
    category: 'plumbing',
    urgency: 'high',
    status: 'pending',
    assignedBy: {
      name: 'Sarah Estates Officer',
      email: 'sarah@estates.mak.ac.ug'
    },
    assignedAt: '2026-04-29T10:15:00',
    deadline: '2026-04-30T12:00:00',
    workReports: []
  },
  {
    _id: 'task_003',
    trackingId: 'CMS-2026-004',
    complaintId: 'comp_004',
    title: 'Broken elevator in Library - People trapped',
    description: 'Main elevator stuck between 2nd and 3rd floor. 4 students trapped inside.',
    location: 'Library, Main Building',
    zone: 'Main Campus',
    category: 'mechanical',
    urgency: 'critical',
    status: 'resolved',
    assignedBy: {
      name: 'John Estates Officer',
      email: 'john@estates.mak.ac.ug'
    },
    assignedAt: '2026-04-28T09:45:00',
    deadline: '2026-04-28T17:00:00',
    resolvedAt: '2026-04-28T14:30:00',
    workReports: [
      {
        id: 'wr_002',
        status: 'in-progress',
        actionsTaken: 'Reset elevator control panel. Manual override to bring elevator to ground floor.',
        materialsUsed: [
          { name: 'Control Panel Key', quantity: 1, cost: 0 }
        ],
        hoursSpent: 2,
        reportedBy: 'Peter Okello',
        reportedAt: '2026-04-28T11:30:00',
        notes: 'Students safely evacuated. Need software update.'
      },
      {
        id: 'wr_003',
        status: 'resolved',
        actionsTaken: 'Updated elevator control software. Tested all safety features. Elevator now operational.',
        materialsUsed: [
          { name: 'Software Update Kit', quantity: 1, cost: 0 },
          { name: 'Lubricant', quantity: 2, cost: 25000 }
        ],
        hoursSpent: 3.5,
        reportedBy: 'Peter Okello',
        reportedAt: '2026-04-28T14:30:00',
        notes: 'Elevator functioning normally. Monitor for 24 hours.'
      }
    ]
  },
  {
    _id: 'task_004',
    trackingId: 'CMS-2026-003',
    complaintId: 'comp_003',
    title: 'Cracked wall in Lecture Hall B - Structural concern',
    description: 'Large crack on the southern wall extending from floor to ceiling. Appears structural.',
    location: 'Lecture Hall B, Room 201',
    zone: 'Main Campus',
    category: 'structural',
    urgency: 'high',
    status: 'pending',
    assignedBy: {
      name: 'Robert Estates Officer',
      email: 'robert@estates.mak.ac.ug'
    },
    assignedAt: '2026-04-29T14:20:00',
    deadline: '2026-05-01T17:00:00',
    workReports: []
  },
  {
    _id: 'task_005',
    trackingId: 'CMS-2026-005',
    complaintId: 'comp_005',
    title: 'No hot water in Hall A - Water heater malfunction',
    description: 'Water heater not working. No hot water for over 200 residents.',
    location: 'Hall A, Basement',
    zone: 'North Campus',
    category: 'plumbing',
    urgency: 'medium',
    status: 'pending',
    assignedBy: {
      name: 'Sarah Estates Officer',
      email: 'sarah@estates.mak.ac.ug'
    },
    assignedAt: '2026-04-29T16:00:00',
    deadline: '2026-05-02T17:00:00',
    workReports: []
  }
];

export const currentTechnician = {
  _id: 'tech_001',
  name: 'Robert Mukiibi',
  email: 'robert.m@estates.mak.ac.ug',
  phone: '+256 712 345 678',
  trade: 'electrical',
  zone: ['Main Campus', 'East Campus'],
  avatar: null,
  joinDate: '2023-01-15'
};

export const fetchTechnicianTasks = async (technicianId) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTasks;
};

export const updateTaskStatus = async (taskId, status, workReport) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, taskId, status, workReport };
};