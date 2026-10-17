export interface SAPCourse {
  id: string;
  title: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  certification?: string;
  description: string;
  courseCode: string;
}

export const sapLearningHubCourses: SAPCourse[] = [
  {
    id: 'sap-course-1',
    courseCode: 'DEV100',
    title: 'SAP AI Fundamentals & Business AI Concepts (DEV100)',
    topic: 'Artificial Intelligence & Machine Learning',
    level: 'Beginner',
    duration: '12 Hours',
    certification: 'SAP Certified Associate - Business AI',
    description: 'Learn foundational concepts of Generative AI, machine learning pipelines, and ethics in enterprise Business AI.',
  },
  {
    id: 'sap-course-2',
    courseCode: 'DEV260',
    title: 'Developing with SAP AI Core & SAP AI Launchpad (DEV260)',
    topic: 'AI Operations & MLOps',
    level: 'Intermediate',
    duration: '24 Hours',
    certification: 'SAP Certified Development Associate - AI Core',
    description: 'Hands-on deployment of machine learning models, batch inferencing, model evaluation, and monitoring using SAP AI Core.',
  },
  {
    id: 'sap-course-3',
    courseCode: 'CLD200',
    title: 'SAP Business Technology Platform (BTP) Extension Suite (CLD200)',
    topic: 'Cloud Development & Integration',
    level: 'Intermediate',
    duration: '30 Hours',
    certification: 'SAP Certified Citizen Developer Associate - SAP BTP',
    description: 'Build enterprise cloud applications, microservices, and API integrations on SAP BTP.',
  },
  {
    id: 'sap-course-4',
    courseCode: 'DAT100',
    title: 'Data Modeling & Analytics with SAP HANA Cloud (DAT100)',
    topic: 'Data Engineering & Analytics',
    level: 'Intermediate',
    duration: '20 Hours',
    certification: 'SAP Certified Application Associate - SAP HANA Cloud',
    description: 'Design relational database models, advanced SQL views, and real-time streaming analytics.',
  },
  {
    id: 'sap-course-5',
    courseCode: 'SPA100',
    title: 'Enterprise Process Automation with SAP Build Process Automation (SPA100)',
    topic: 'RPA & Automation',
    level: 'Beginner',
    duration: '16 Hours',
    description: 'Automate business workflows, document processing, and robotic process automation (RPA) without code.',
  },
  {
    id: 'sap-course-6',
    courseCode: 'SEC100',
    title: 'SAP Security, Identity & Governance Fundamentals (SEC100)',
    topic: 'Cybersecurity & Governance',
    level: 'Intermediate',
    duration: '18 Hours',
    description: 'Role-based access control, encryption standards, identity authentication, and AI safety governance.',
  },
  {
    id: 'sap-course-7',
    courseCode: 'DEV280',
    title: 'SAP Cloud Application Programming Model (CAP) Node.js & TypeScript (DEV280)',
    topic: 'Full Stack & Cloud Native Development',
    level: 'Advanced',
    duration: '28 Hours',
    certification: 'SAP Certified Development Associate - SAP Cloud Application Programming Model',
    description: 'Build robust enterprise microservices using Node.js, TypeScript, Core Data Services (CDS), and OData APIs on SAP BTP.',
  },
  {
    id: 'sap-course-8',
    courseCode: 'SAC010',
    title: 'SAP Analytics Cloud: Enterprise Planning & Predictive Analytics (SAC010)',
    topic: 'Business Intelligence & Predictive Analytics',
    level: 'Intermediate',
    duration: '22 Hours',
    certification: 'SAP Certified Application Associate - SAP Analytics Cloud',
    description: 'Design predictive forecasting models, interactive KPI storyboards, and smart discovery dashboards.',
  },
  {
    id: 'sap-course-9',
    courseCode: 'BLD100',
    title: 'Developing Low-Code Applications with SAP Build Apps (BLD100)',
    topic: 'Rapid Application Development',
    level: 'Beginner',
    duration: '14 Hours',
    description: 'Create responsive web and mobile applications with drag-and-drop logic and REST API integrations.',
  },
  {
    id: 'sap-course-10',
    courseCode: 'CLD900',
    title: 'SAP Integration Suite & API Management (CLD900)',
    topic: 'Enterprise Integration & API Ecosystems',
    level: 'Advanced',
    duration: '26 Hours',
    certification: 'SAP Certified Development Specialist - SAP Integration Suite',
    description: 'Orchestrate hybrid cloud integrations, API proxies, event-driven architectures, and security policies.',
  },
];
