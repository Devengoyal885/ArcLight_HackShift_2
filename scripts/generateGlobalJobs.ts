import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const GLOBAL_JOBS_PATH = resolve(process.cwd(), 'src', 'data', 'global_jobs.json');

interface Job {
    id: string;
    source: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
    url: string;
    description: string;
    tags: string[];
    salary?: string;
    postedAt?: string;
    companyLogo?: string;
    latitude?: number;
    longitude?: number;
}

// Tech hubs with coordinates [lat, lng]
const TECH_HUBS: Record<string, { lat: number, lng: number, country: string }> = {
    'Bengaluru': { lat: 12.9716, lng: 77.5946, country: 'India' },
    'Hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India' },
    'Pune': { lat: 18.5204, lng: 73.8567, country: 'India' },
    'Mumbai': { lat: 19.0760, lng: 72.8777, country: 'India' },
    'Gurugram': { lat: 28.4595, lng: 77.0266, country: 'India' },
    'Noida': { lat: 28.5355, lng: 77.3910, country: 'India' },
    'Chennai': { lat: 13.0827, lng: 80.2707, country: 'India' },
    'Delhi': { lat: 28.6139, lng: 77.2090, country: 'India' },
    'San Francisco': { lat: 37.7749, lng: -122.4194, country: 'USA' },
    'Seattle': { lat: 47.6062, lng: -122.3321, country: 'USA' },
    'New York': { lat: 40.7128, lng: -74.0060, country: 'USA' },
    'Austin': { lat: 30.2672, lng: -97.7431, country: 'USA' },
    'Boston': { lat: 42.3601, lng: -71.0589, country: 'USA' },
    'Los Angeles': { lat: 34.0522, lng: -118.2437, country: 'USA' },
    'Chicago': { lat: 41.8781, lng: -87.6298, country: 'USA' },
    'Denver': { lat: 39.7392, lng: -104.9903, country: 'USA' },
    'San Jose': { lat: 37.3382, lng: -121.8863, country: 'USA' },
    'Sunnyvale': { lat: 37.3688, lng: -122.0363, country: 'USA' },
    'Mountain View': { lat: 37.3861, lng: -122.0839, country: 'USA' },
    'London': { lat: 51.5074, lng: -0.1278, country: 'UK' },
    'Cambridge': { lat: 52.2053, lng: 0.1218, country: 'UK' },
    'Berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany' },
    'Munich': { lat: 48.1351, lng: 11.5820, country: 'Germany' },
    'Hamburg': { lat: 53.5511, lng: 9.9937, country: 'Germany' },
    'Frankfurt': { lat: 50.1109, lng: 8.6821, country: 'Germany' },
    'Amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
    'Paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
    'Zurich': { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
    'Dublin': { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
    'Stockholm': { lat: 59.3293, lng: 18.0686, country: 'Sweden' },
    'Madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
    'Barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain' },
    'Warsaw': { lat: 52.2297, lng: 21.0122, country: 'Poland' },
    'Copenhagen': { lat: 55.6761, lng: 12.5683, country: 'Denmark' },
    'Singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
    'Tokyo': { lat: 35.6895, lng: 139.6917, country: 'Japan' },
    'Sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia' },
    'Melbourne': { lat: -37.8136, lng: 144.9631, country: 'Australia' },
    'Seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
    'Hong Kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
    'Taipei': { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
    'Toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
    'Vancouver': { lat: 49.2827, lng: -123.1216, country: 'Canada' },
    'Montreal': { lat: 45.5017, lng: -73.5673, country: 'Canada' },
    'Waterloo': { lat: 43.4643, lng: -80.5204, country: 'Canada' },
    'Dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE' },
    'Abu Dhabi': { lat: 24.4539, lng: 54.3773, country: 'UAE' },
    'Tel Aviv': { lat: 32.0853, lng: 34.7818, country: 'Israel' },
    'Riyadh': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
    'São Paulo': { lat: -23.5505, lng: -46.6333, country: 'Brazil' },
    'Mexico City': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
    'Buenos Aires': { lat: -34.6037, lng: -58.3816, country: 'Argentina' },
    'Cape Town': { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
    'Nairobi': { lat: -1.2921, lng: 36.8219, country: 'Kenya' },
    'Auckland': { lat: -36.8485, lng: 174.7633, country: 'New Zealand' }
};

// Top Tech Companies worldwide mapped to their primary hubs and roles
const TECH_COMPANIES: Array<{
    name: string;
    hub: string;
    role: string;
    salary: string;
    tags: string[];
    type: 'full-time' | 'internship' | 'contract';
    desc: string;
}> = [
    // India (Bengaluru, Hyderabad, Pune, Gurugram, etc.)
    { name: 'Flipkart', hub: 'Bengaluru', role: 'SDE-2 (Backend & Distributed Systems)', salary: '₹28L – ₹38L', tags: ['Java', 'Kafka', 'Redis', 'Microservices'], type: 'full-time', desc: 'Design e-commerce scale event streaming pipelines processing 50M+ requests per day during Big Billion Days.' },
    { name: 'Razorpay', hub: 'Bengaluru', role: 'Payment Platform Engineer', salary: '₹25L – ₹35L', tags: ['Go', 'PostgreSQL', 'Docker', 'Kubernetes'], type: 'full-time', desc: 'Build zero-downtime fintech payment gateways connecting Indian banking infrastructure with instant settlement.' },
    { name: 'Swiggy', hub: 'Bengaluru', role: 'Full Stack Engineer (Instamart & Logistics)', salary: '₹24L – ₹34L', tags: ['React', 'Node.js', 'AWS', 'TypeScript'], type: 'full-time', desc: 'Develop real-time driver tracking, delivery dispatch routing algorithms, and lightning-fast customer web apps.' },
    { name: 'Zomato', hub: 'Gurugram', role: 'Frontend Engineer (Blinkit Fleet Systems)', salary: '₹22L – ₹30L', tags: ['React', 'Next.js', 'TypeScript', 'Tailwind'], type: 'full-time', desc: 'Build reactive merchant & store operations portals with instant state synchronization.' },
    { name: 'PhonePe', hub: 'Bengaluru', role: 'Distributed Systems & UPI Architect', salary: '₹35L – ₹50L', tags: ['Java', 'Cassandra', 'Raft', 'High Throughput'], type: 'full-time', desc: 'Lead architecture for UPI transaction switching engines maintaining 99.999% availability.' },
    { name: 'Zerodha', hub: 'Bengaluru', role: 'Systems Programmer (Go / Python)', salary: '₹26L – ₹40L', tags: ['Go', 'Python', 'PostgreSQL', 'WebSockets'], type: 'full-time', desc: 'Build low-latency financial trading interfaces processing millions of market order packets per second.' },
    { name: 'Cred', hub: 'Bengaluru', role: 'Mobile / React Native Developer', salary: '₹28L – ₹42L', tags: ['React Native', 'TypeScript', 'GraphQL', 'Animation'], type: 'full-time', desc: 'Create visually stunning and fluid financial experiences with micro-animations.' },
    { name: 'Microsoft India IDC', hub: 'Hyderabad', role: 'Software Engineer II (Azure Cloud Infra)', salary: '₹32L – ₹45L', tags: ['C#', 'C++', 'Azure', 'Kubernetes'], type: 'full-time', desc: 'Engineer cloud hypervisor telemetry, software-defined networking, and Azure core compute fabrics.' },
    { name: 'Google India', hub: 'Bengaluru', role: 'Software Engineer III (Search & GenAI)', salary: '₹40L – ₹60L', tags: ['Python', 'C++', 'TensorFlow', 'LLMs'], type: 'full-time', desc: 'Accelerate next-generation multimodal search retrieval architectures across Asian languages.' },
    { name: 'Amazon India', hub: 'Hyderabad', role: 'SDE-1 (AWS Lambda & Serverless)', salary: '₹22L – ₹30L', tags: ['Java', 'AWS', 'Distributed Systems'], type: 'full-time', desc: 'Scale serverless execution engines optimizing cold-start times across multi-tenant containers.' },
    { name: 'Postman', hub: 'Bengaluru', role: 'API Platform Engineer', salary: '₹26L – ₹38L', tags: ['Node.js', 'TypeScript', 'APIs', 'Docker'], type: 'full-time', desc: 'Empower 30+ million global developers collaborating on modern REST and GraphQL APIs.' },
    { name: 'Infosys Wingspan', hub: 'Pune', role: 'Enterprise Cloud Developer', salary: '₹10L – ₹16L', tags: ['Java', 'Spring Boot', 'Angular', 'Oracle'], type: 'full-time', desc: 'Develop enterprise digital transformation solutions for Global Fortune 500 financial clients.' },
    { name: 'TCS Research & Innovations', hub: 'Mumbai', role: 'AI / Computer Vision Researcher', salary: '₹14L – ₹22L', tags: ['PyTorch', 'Computer Vision', 'Python'], type: 'full-time', desc: 'Research deep learning models for industrial automation, defect detection, and OCR.' },
    { name: 'Zoho Corporation', hub: 'Chennai', role: 'Core Web Platform Engineer', salary: '₹15L – ₹24L', tags: ['Java', 'JavaScript', 'SQL', 'Security'], type: 'full-time', desc: 'Build independent enterprise SaaS suite components serving over 100M business users.' },
    { name: 'Paytm Payments Bank', hub: 'Noida', role: 'Fintech Security Engineer', salary: '₹20L – ₹28L', tags: ['Go', 'Cryptography', 'Fintech', 'Linux'], type: 'full-time', desc: 'Safeguard banking APIs, tokenized authentication schemes, and PCI-DSS compliance.' },
    { name: 'Khatabook', hub: 'Bengaluru', role: 'Backend Intern / Associate', salary: '₹6L – ₹10L', tags: ['Node.js', 'MongoDB', 'Redis'], type: 'internship', desc: 'Empower 10M+ local Indian merchant storefronts managing digital ledgers and payments.' },
    { name: 'Licious', hub: 'Bengaluru', role: 'Supply Chain Optimization Engineer', salary: '₹18L – ₹26L', tags: ['Python', 'Operations Research', 'FastAPI'], type: 'full-time', desc: 'Build algorithmic perishable goods supply chain prediction and dynamic inventory allocation.' },
    { name: 'Groww', hub: 'Bengaluru', role: 'Frontend Architect (Investments Portal)', salary: '₹30L – ₹44L', tags: ['React', 'Next.js', 'Redux Toolkit', 'Performance'], type: 'full-time', desc: 'Create frictionless mutual fund and equities investment journeys for millions of retail investors.' },

    // United States (Silicon Valley, Seattle, NY, Austin, Boston)
    { name: 'Stripe', hub: 'San Francisco', role: 'Staff Distributed Systems Engineer', salary: '$220k – $290k', tags: ['Go', 'Ruby', 'Raft', 'Kubernetes'], type: 'full-time', desc: 'Scale global payment rails moving hundreds of billions in GDP every year with 5-nines SLA.' },
    { name: 'OpenAI', hub: 'San Francisco', role: 'AI Infrastructure & Supercomputing Engineer', salary: '$250k – $350k', tags: ['Python', 'CUDA', 'C++', 'PyTorch', 'Distributed ML'], type: 'full-time', desc: 'Optimize training clusters with thousands of GPUs running frontier foundation models.' },
    { name: 'Anthropic', hub: 'San Francisco', role: 'Claude Safety & Alignment Research Engineer', salary: '$240k – $340k', tags: ['Python', 'PyTorch', 'RLHF', 'Interpretability'], type: 'full-time', desc: 'Develop scalable oversight and constitutional AI methodologies for helpful, harmless systems.' },
    { name: 'Apple', hub: 'Sunnyvale', role: 'SwiftUI & CoreOS Systems Engineer', salary: '$180k – $240k', tags: ['Swift', 'C++', 'Metal', 'Objective-C'], type: 'full-time', desc: 'Create foundational OS user interfaces and window management engines for macOS and iOS.' },
    { name: 'Meta', hub: 'Mountain View', role: 'Llama Open Source Systems Engineer', salary: '$210k – $280k', tags: ['PyTorch', 'C++', 'Python', 'CUDA'], type: 'full-time', desc: 'Enable open research and high-performance inference acceleration on mobile and server hardware.' },
    { name: 'Google DeepMind', hub: 'Mountain View', role: 'Research Scientist (Gemini Multimodal)', salary: '$260k – $380k', tags: ['Python', 'JAX', 'Deep Learning', 'Transformers'], type: 'full-time', desc: 'Push the frontiers of reasoning, visual understanding, and autonomous coding agents.' },
    { name: 'Netflix', hub: 'Los Angeles', role: 'Streaming Delivery & Edge CDN Engineer', salary: '$230k – $320k', tags: ['Java', 'C++', 'FreeBSD', 'Video Transcoding'], type: 'full-time', desc: 'Optimize Open Connect appliances delivering petabits of 4K HDR streams to 270M+ subscribers.' },
    { name: 'Figma', hub: 'San Francisco', role: 'WebAssembly & Rendering Engine Engineer', salary: '$190k – $260k', tags: ['C++', 'Rust', 'WebAssembly', 'WebGL'], type: 'full-time', desc: 'Architect collaborative multiplayer canvas rendering 60FPS vector graphics in the browser.' },
    { name: 'GitHub', hub: 'San Francisco', role: 'Copilot Autocompletion Engineer', salary: '$175k – $230k', tags: ['TypeScript', 'Python', 'LLMs', 'Rust'], type: 'full-time', desc: 'Deliver sub-100ms intelligent code suggestion streams directly into developer IDEs.' },
    { name: 'Databricks', hub: 'San Francisco', role: 'Spark & Delta Lake Engine Developer', salary: '$200k – $270k', tags: ['Scala', 'Java', 'C++', 'Distributed Systems'], type: 'full-time', desc: 'Build the lakehouse platform unifying structured analytics and enterprise AI models.' },
    { name: 'Snowflake', hub: 'Seattle', role: 'Cloud Query Optimization Specialist', salary: '$195k – $260k', tags: ['C++', 'Java', 'SQL', 'Cloud Storage'], type: 'full-time', desc: 'Architect vectorized execution query engines minimizing cloud compute credit consumption.' },
    { name: 'Vercel', hub: 'San Francisco', role: 'Next.js Core Framework Engineer', salary: '$170k – $230k', tags: ['Rust', 'TypeScript', 'React', 'Turbopack'], type: 'full-time', desc: 'Speed up incremental compiler bundlers and server component streaming protocols.' },
    { name: 'Amazon Web Services', hub: 'Seattle', role: 'Senior S3 Storage Architecture Engineer', salary: '$190k – $250k', tags: ['Java', 'C++', 'Distributed Storage'], type: 'full-time', desc: 'Manage exabyte-scale durable object storage clusters with 11 9s durability.' },
    { name: 'Microsoft', hub: 'Seattle', role: 'TypeScript Compiler & Language Services Engineer', salary: '$180k – $240k', tags: ['TypeScript', 'Compiler Design', 'Node.js'], type: 'full-time', desc: 'Enhance language server protocol performance and advanced type system inferences.' },
    { name: 'Bloomberg', hub: 'New York', role: 'Financial Terminal Real-Time Systems Engineer', salary: '$185k – $245k', tags: ['C++', 'Python', 'Linux', 'Low Latency'], type: 'full-time', desc: 'Deliver tick-level worldwide market feeds and analytical charts to Wall Street desks.' },
    { name: 'Two Sigma', hub: 'New York', role: 'Quantitative Platform Developer', salary: '$220k – $320k', tags: ['Python', 'Java', 'Distributed Computing', 'Linux'], type: 'full-time', desc: 'Engineer scientific computing pipelines analyzing petabytes of economic and market signals.' },
    { name: 'Tesla', hub: 'Austin', role: 'Autopilot & Full Self-Driving Vision Engineer', salary: '$180k – $250k', tags: ['C++', 'Python', 'PyTorch', 'Embedded Systems'], type: 'full-time', desc: 'Train spatial temporal neural networks consuming 8 vehicle cameras in real-time.' },
    { name: 'Dell Technologies', hub: 'Austin', role: 'Enterprise Edge Solutions Architect', salary: '$140k – $190k', tags: ['Linux', 'Kubernetes', 'Ansible', 'Networking'], type: 'full-time', desc: 'Deploy sovereign edge compute micro data centers for smart cities and manufacturing.' },
    { name: 'Boston Dynamics', hub: 'Boston', role: 'Robotics Control & Kinematics Engineer', salary: '$160k – $220k', tags: ['C++', 'Robotics', 'ROS', 'Control Theory'], type: 'full-time', desc: 'Program dynamic balance algorithms for quadrupeds and humanoid robots across uneven terrain.' },

    // Europe (London, Berlin, Amsterdam, Zurich, Paris, Munich, Stockholm)
    { name: 'DeepMind UK', hub: 'London', role: 'Research Engineer (AlphaFold & Molecular Modeling)', salary: '£120k – £170k', tags: ['Python', 'JAX', 'Structural Biology', 'PyTorch'], type: 'full-time', desc: 'Design deep neural networks predicting biomolecular complexes and accelerating drug discovery.' },
    { name: 'Revolut', hub: 'London', role: 'Global Treasury & Core Banking Architect', salary: '£100k – £150k', tags: ['Java', 'PostgreSQL', 'Microservices', 'Kafka'], type: 'full-time', desc: 'Build multi-currency clearing engines supporting instant foreign exchange in 30+ currencies.' },
    { name: 'Deliveroo', hub: 'London', role: 'Dispatch Algorithm Optimization Engineer', salary: '£85k – £125k', tags: ['Scala', 'Go', 'Machine Learning', 'AWS'], type: 'full-time', desc: 'Optimize matching of delivery riders with kitchens in 10 countries across Europe.' },
    { name: 'Spotify', hub: 'Stockholm', role: 'Personalization & Audio Discovery Engineer', salary: 'SEK 900k – 1.3M', tags: ['Java', 'Python', 'GCP', 'Bandit Algorithms'], type: 'full-time', desc: 'Deliver daily mixes and discover weekly recommendations to 600M listeners.' },
    { name: 'Klarna', hub: 'Stockholm', role: 'Checkout Experience Engineer', salary: 'SEK 850k – 1.2M', tags: ['TypeScript', 'React', 'Node.js', 'Fintech'], type: 'full-time', desc: 'Build frictionless 1-click buy-now-pay-later payment flows used across Europe and North America.' },
    { name: 'ASML', hub: 'Amsterdam', role: 'Extreme UV Lithography Software Engineer', salary: '€85k – €125k', tags: ['C++', 'Python', 'Real-Time OS', 'Physics Simulation'], type: 'full-time', desc: 'Develop nanometer precision calibration software for semiconductor chip making machines.' },
    { name: 'Booking.com', hub: 'Amsterdam', role: 'Search & Pricing Engine Architect', salary: '€90k – €135k', tags: ['Java', 'Kubernetes', 'MySQL', 'High Availability'], type: 'full-time', desc: 'Maintain sub-second room availability search across 28 million accommodation listings.' },
    { name: 'Adyen', hub: 'Amsterdam', role: 'Global Merchant Gateway Developer', salary: '€95k – €140k', tags: ['Java', 'PostgreSQL', 'Fintech', 'Security'], type: 'full-time', desc: 'Process payment processing directly connected to card schemes in single unified platforms.' },
    { name: 'SAP SE', hub: 'Frankfurt', role: 'HANA In-Memory Database Kernel Engineer', salary: '€90k – €130k', tags: ['C++', 'Linux', 'Databases', 'Concurrency'], type: 'full-time', desc: 'Optimize multi-core vectorized relational query execution in terabyte memory servers.' },
    { name: 'Delivery Hero', hub: 'Berlin', role: 'Logistics Routing & Microservices Engineer', salary: '€80k – €115k', tags: ['Go', 'Kubernetes', 'Kafka', 'Google Cloud'], type: 'full-time', desc: 'Coordinate quick-commerce deliveries across 70 countries worldwide.' },
    { name: 'N26', hub: 'Berlin', role: 'Mobile Banking Security Specialist', salary: '€75k – €110k', tags: ['Kotlin', 'Swift', 'OAuth2', 'Fintech'], type: 'full-time', desc: 'Protect mobile banking users across the Eurozone with biometric 2FA protocols.' },
    { name: 'BMW Group', hub: 'Munich', role: 'Connected Autonomous Vehicle Cloud Developer', salary: '€85k – €120k', tags: ['Python', 'AWS', 'IoT', 'MQTT'], type: 'full-time', desc: 'Stream over-the-air firmware and telematics analytics for millions of luxury electric vehicles.' },
    { name: 'Mistral AI', hub: 'Paris', role: 'LLM Inference Optimization Engineer', salary: '€110k – €160k', tags: ['C++', 'Rust', 'CUDA', 'Python', 'Quantization'], type: 'full-time', desc: 'Deploy open-weights frontier reasoning models with extreme token per second efficiency.' },
    { name: 'Dassault Systèmes', hub: 'Paris', role: '3D Simulation & CAD Core Developer', salary: '€70k – €105k', tags: ['C++', 'Computational Geometry', 'WebGL'], type: 'full-time', desc: 'Engineer virtual twin digital manufacturing suites for aerospace and automotive engineers.' },
    { name: 'Google Zurich', hub: 'Zurich', role: 'YouTube Infrastructure & Cloud Storage Architect', salary: 'CHF 180k – 250k', tags: ['C++', 'Distributed Systems', 'Python'], type: 'full-time', desc: 'Build hyper-scalable distributed storage and transcoding pipelines for global video uploads.' },
    { name: 'Stripe Ireland', hub: 'Dublin', role: 'European Payments Compliance & Rails Lead', salary: '€110k – €160k', tags: ['Ruby', 'Go', 'Fintech', 'SEPA'], type: 'full-time', desc: 'Connect pan-European instant bank transfers and local payment schemes.' },
    { name: 'Glovo', hub: 'Barcelona', role: 'Dynamic Pricing & Marketplace Engineer', salary: '€65k – €95k', tags: ['Java', 'Python', 'Microservices', 'AWS'], type: 'full-time', desc: 'Model real-time courier supply-demand matching curves across Southern Europe and Africa.' },
    { name: 'Allegro', hub: 'Warsaw', role: 'E-Commerce Marketplace Search Specialist', salary: 'PLN 200k – 300k', tags: ['Java', 'Elasticsearch', 'Kotlin'], type: 'full-time', desc: 'Empower Central Europe’s biggest e-commerce portal indexing 250 million active offers.' },

    // Asia-Pacific (Singapore, Tokyo, Sydney, Melbourne, Seoul, Hong Kong)
    { name: 'Grab', hub: 'Singapore', role: 'SuperApp Marketplace Reliability Engineer', salary: 'SGD 110k – 160k', tags: ['Go', 'Kafka', 'Terraform', 'Azure'], type: 'full-time', desc: 'Ensure ride-hailing and food delivery reliability for 180 million Southeast Asian consumers.' },
    { name: 'Sea Group / Shopee', hub: 'Singapore', role: 'Cross-Border Logistics Platform Developer', salary: 'SGD 100k – 150k', tags: ['Go', 'Python', 'Kubernetes', 'MySQL'], type: 'full-time', desc: 'Coordinate multi-country customs clearance and warehouse routing across 7 Asian markets.' },
    { name: 'Rakuten', hub: 'Tokyo', role: 'Global Fintech & Loyalty Cloud Engineer', salary: '¥9M – ¥14M', tags: ['Java', 'Docker', 'AWS', 'Spring Boot'], type: 'full-time', desc: 'Scale Japan’s biggest digital ecosystem unifying fintech, e-commerce, and mobile telecom.' },
    { name: 'Sony Interactive Entertainment', hub: 'Tokyo', role: 'PlayStation Network Infrastructure Engineer', salary: '¥10M – ¥15M', tags: ['C++', 'Networking', 'Linux', 'AWS'], type: 'full-time', desc: 'Deliver low-latency multiplayer matchmaking and cloud game saves to 100M+ PlayStation gamers.' },
    { name: 'Coupang', hub: 'Seoul', role: 'Rocket Delivery Logistics Architect', salary: '₩90M – 130M', tags: ['Java', 'Architecture', 'Microservices'], type: 'full-time', desc: 'Power dawn-delivery logistics moving packages from warehouse to doorstep in under 7 hours.' },
    { name: 'Atlassian', hub: 'Sydney', role: 'Jira Cloud Platform Scalability Engineer', salary: 'AUD 160k – 220k', tags: ['Java', 'React', 'AWS', 'GraphQL'], type: 'full-time', desc: 'Re-architect Jira Cloud tenant data isolation and zero-downtime cross-region migration.' },
    { name: 'Canva', hub: 'Sydney', role: 'Web Graphics & Visual Design Engine Engineer', salary: 'AUD 150k – 210k', tags: ['TypeScript', 'WebGL', 'Canvas2D', 'React'], type: 'full-time', desc: 'Empower 170M users worldwide with effortless vector manipulation and AI image generative tools.' },

    // Canada (Toronto, Vancouver, Montreal, Waterloo)
    { name: 'Shopify', hub: 'Toronto', role: 'Storefront Rendering & GraphQL Lead', salary: 'CAD 160k – 230k', tags: ['Ruby', 'Go', 'GraphQL', 'React', 'Rust'], type: 'full-time', desc: 'Deliver instant web commerce page loads across 4+ million independent online merchants.' },
    { name: 'Cohere', hub: 'Toronto', role: 'Enterprise LLM Retrieval & Embeddings Engineer', salary: 'CAD 180k – 250k', tags: ['Python', 'PyTorch', 'Vector DB', 'NLP'], type: 'full-time', desc: 'Train dense text embeddings and reranking algorithms powering enterprise semantic search.' },
    { name: 'Hootsuite', hub: 'Vancouver', role: 'Social Media Scheduling Platform Architect', salary: 'CAD 130k – 180k', tags: ['Scala', 'React', 'TypeScript', 'AWS'], type: 'full-time', desc: 'Manage enterprise social integrations across X, LinkedIn, Instagram, and TikTok.' },

    // Latin America (São Paulo, Mexico City, Buenos Aires)
    { name: 'Nubank', hub: 'São Paulo', role: 'Clojure / Fintech Core Banking Developer', salary: 'R$ 180k – 280k', tags: ['Clojure', 'Datomic', 'Functional Programming', 'Kafka'], type: 'full-time', desc: 'Serve 100 million Latin American banking clients with zero-maintenance functional ledger code.' },
    { name: 'Mercado Libre', hub: 'Buenos Aires', role: 'Logistics Fleet & Payment Routing Engineer', salary: '$55k – $85k USD', tags: ['Java', 'Go', 'MySQL', 'Docker'], type: 'full-time', desc: 'Deliver South America’s biggest marketplace fulfillment systems and Mercado Pago fintech.' },

    // Middle East & Africa (Dubai, Tel Aviv, Riyadh, Nairobi, Cape Town)
    { name: 'Careem (Uber)', hub: 'Dubai', role: 'Everything App Dispatch & Payments Engineer', salary: 'AED 240k – 360k', tags: ['Java', 'Kotlin', 'AWS', 'Microservices'], type: 'full-time', desc: 'Build the super app of the Middle East spanning taxi rides, food, and digital wallet transfers.' },
    { name: 'Wiz', hub: 'Tel Aviv', role: 'Cloud Security Posture (CSPM) Core Engineer', salary: '$160k – $220k', tags: ['Go', 'Graph DB', 'AWS', 'Azure', 'GCP'], type: 'full-time', desc: 'Map multi-cloud infrastructure graphs detecting critical toxic risk combinations in real-time.' },
    { name: 'Tabby', hub: 'Riyadh', role: 'Fintech Credit Decisioning Engineer', salary: 'SAR 220k – 320k', tags: ['Python', 'FastAPI', 'ML', 'Risk'], type: 'full-time', desc: 'Build instantaneous credit underwriting algorithms across Gulf retail stores.' },
    { name: 'Flutterwave', hub: 'Nairobi', role: 'Pan-African Payment Rails Engineer', salary: '$60k – $90k USD', tags: ['Node.js', 'Python', 'Mobile Money', 'Fintech'], type: 'full-time', desc: 'Bridge M-Pesa, card schemes, and local African clearing houses with unified developer APIs.' },
    { name: 'Takealot', hub: 'Cape Town', role: 'Warehouse Automation & Fulfillment Developer', salary: 'ZAR 750k – 1.1M', tags: ['Python', 'PHP', 'PostgreSQL', 'Docker'], type: 'full-time', desc: 'Scale South Africa’s leading retail distribution centers with barcode scanner robotics.' },

    // Additional Worldwide Hubs Expansion
    { name: 'Meesho', hub: 'Bengaluru', role: 'Staff Backend Architect (E-Commerce Scale)', salary: '₹36L – ₹52L', tags: ['Java', 'Kafka', 'Redis', 'High Scale'], type: 'full-time', desc: 'Power tier-2 and tier-3 Indian social commerce platforms serving 140M active transacting users.' },
    { name: 'InMobi', hub: 'Bengaluru', role: 'AdTech Real-Time Bidding Engineer', salary: '₹28L – ₹40L', tags: ['C++', 'Java', 'Low Latency', 'Big Data'], type: 'full-time', desc: 'Process 100B+ programmatic ad auction requests daily with sub-30ms response times.' },
    { name: 'Freshworks', hub: 'Chennai', role: 'SaaS Platform & Multi-Tenant Lead', salary: '₹26L – ₹38L', tags: ['Ruby', 'Go', 'AWS', 'Distributed Systems'], type: 'full-time', desc: 'Deliver multi-product unified business software suite used by 60,000+ businesses worldwide.' },
    { name: 'Urban Company', hub: 'Gurugram', role: 'Mobile Logistics & Dispatch Engineer', salary: '₹24L – ₹34L', tags: ['React Native', 'Node.js', 'MongoDB'], type: 'full-time', desc: 'Orchestrate home services logistics, slot allocation, and technician dispatch in 5 countries.' },
    { name: 'Palantir', hub: 'New York', role: 'Foundry Data Platform Integration Engineer', salary: '$180k – $240k', tags: ['Java', 'TypeScript', 'Data Integration', 'Ontology'], type: 'full-time', desc: 'Deploy enterprise operational operating systems integrating disparate petabyte-scale data lakes.' },
    { name: 'Datadog', hub: 'New York', role: 'Distributed Tracing & APM Platform Engineer', salary: '$185k – $245k', tags: ['Go', 'C++', 'Kafka', 'Linux'], type: 'full-time', desc: 'Collect and visualize trillions of distributed telemetry spans across cloud infrastructures.' },
    { name: 'Airbnb', hub: 'San Francisco', role: 'Design Systems & Core Web Architect', salary: '$195k – $265k', tags: ['React', 'TypeScript', 'CSS/Design Systems', 'Performance'], type: 'full-time', desc: 'Build the world-renowned visual design language system powering all Airbnb guest and host interfaces.' },
    { name: 'Uber', hub: 'San Francisco', role: 'Marketplace Dynamic Pricing & Surge Lead', salary: '$210k – $285k', tags: ['Go', 'Java', 'Machine Learning', 'Geospatial'], type: 'full-time', desc: 'Real-time supply-demand geospatial balancing connecting millions of riders and drivers.' },
    { name: 'Monzo', hub: 'London', role: 'Go Microservices & Ledger Engineer', salary: '£90k – £135k', tags: ['Go', 'Cassandra', 'Kubernetes', 'Banking'], type: 'full-time', desc: 'Scale modern challenger bank architecture serving 9 million UK customers with 2,500+ microservices.' },
    { name: 'Wise', hub: 'London', role: 'Cross-Border Real-Time Payment Settlement Lead', salary: '£95k – £145k', tags: ['Java', 'Spring', 'Kafka', 'Fintech'], type: 'full-time', desc: 'Make moving money international instant, transparent, and drastically cheaper.' },
    { name: 'ARM Holdings', hub: 'Cambridge', role: 'Microprocessor Architecture & IP Verification', salary: '£80k – £120k', tags: ['C++', 'Verilog', 'Assembly', 'Silicon Design'], type: 'full-time', desc: 'Verify semiconductor processor IP architectures powering 99% of global smartphones.' },
    { name: 'ByteDance', hub: 'Singapore', role: 'Global Video Streaming & CDN Optimization', salary: 'SGD 120k – 180k', tags: ['C++', 'Go', 'Video Streaming', 'H.265'], type: 'full-time', desc: 'Optimize high-concurrency video delivery networks serving billions of short-form video impressions.' },
    { name: 'Sony Music / PlayStation', hub: 'Tokyo', role: 'Spatial Audio & Game Engine Sound Architect', salary: '¥11M – ¥16M', tags: ['C++', 'DSP', 'Audio Engineering', 'Unreal Engine'], type: 'full-time', desc: 'Create 3D immersive tempest audio engines for next-generation interactive experiences.' },
    { name: '1Password', hub: 'Toronto', role: 'Zero-Knowledge Cryptography Software Engineer', salary: 'CAD 150k – $210k', tags: ['Rust', 'TypeScript', 'Cryptography', 'WebAuthn'], type: 'full-time', desc: 'Secure passwords and digital identities for over 100,000 global businesses with zero-knowledge math.' }
];

async function generateJobs() {
    console.log('Generating rich global jobs dataset...');
    const allJobs: Job[] = [];

    // 1. Fetch live jobs from Arbeitnow (Page 1 & 2)
    for (const page of [1, 2]) {
        try {
            console.log(`Fetching live Arbeitnow jobs (page ${page})...`);
            const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
            if (res.ok) {
                const data = await res.json();
                const items = (data.data || []).slice(0, 100);
                for (let i = 0; i < items.length; i++) {
                    const j = items[i];
                    let loc = j.location || 'Berlin, Germany';
                    // Find matching hub
                    let hubKey = 'Berlin';
                    for (const h of Object.keys(TECH_HUBS)) {
                        if (loc.toLowerCase().includes(h.toLowerCase())) {
                            hubKey = h;
                            break;
                        }
                    }
                    const coords = TECH_HUBS[hubKey] || TECH_HUBS['Berlin'];
                    // slight jitter so pins don't overlap completely
                    const jitterLat = (Math.random() - 0.5) * 0.08;
                    const jitterLng = (Math.random() - 0.5) * 0.08;

                    allJobs.push({
                        id: `arbeitnow-${j.slug || `${page}-${i}`}`,
                        source: 'Arbeitnow Global',
                        title: j.title,
                        company: j.company_name || 'Global Tech',
                        location: `${hubKey}, ${coords.country}`,
                        remote: !!j.remote,
                        type: (j.job_types && j.job_types.includes('parttime')) ? 'part-time' : 'full-time',
                        url: j.url || 'https://www.arbeitnow.com',
                        description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 380),
                        tags: (j.tags && j.tags.length > 0) ? j.tags.slice(0, 5) : ['Engineering', 'Tech', 'Cloud'],
                        salary: '€65k – €95k',
                        postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
                        latitude: coords.lat + jitterLat,
                        longitude: coords.lng + jitterLng
                    });
                }
                console.log(`Added ${items.length} live Arbeitnow jobs from page ${page}.`);
            }
        } catch (e) {
            console.warn(`Arbeitnow page ${page} fetch failed:`, e);
        }
    }

    // 2. Fetch live Remotive across categories
    const categories = ['software-dev', 'data', 'devops', 'product'];
    for (const cat of categories) {
        try {
            console.log(`Fetching live Remotive ${cat} jobs...`);
            const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=40`);
            if (res.ok) {
                const data = await res.json();
                const jobs = data.jobs || [];
                const hubList = Object.keys(TECH_HUBS);
                jobs.forEach((j: any) => {
                    const reqLoc = j.candidate_required_location || 'USA';
                    let matchedHub = 'San Francisco';
                    for (const h of hubList) {
                        if (reqLoc.toLowerCase().includes(h.toLowerCase()) || reqLoc.toLowerCase().includes(TECH_HUBS[h].country.toLowerCase())) {
                            matchedHub = h;
                            break;
                        }
                    }
                    const coords = TECH_HUBS[matchedHub] || TECH_HUBS['San Francisco'];
                    const jitterLat = (Math.random() - 0.5) * 0.09;
                    const jitterLng = (Math.random() - 0.5) * 0.09;

                    allJobs.push({
                        id: `remotive-${j.id}`,
                        source: 'Remotive Global',
                        title: j.title,
                        company: j.company_name,
                        location: `${matchedHub}, ${coords.country} (Remote)`,
                        remote: true,
                        type: 'full-time',
                        url: j.url,
                        description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 380),
                        tags: (j.tags || []).slice(0, 5),
                        salary: j.salary || '$95k – $145k',
                        postedAt: j.publication_date || new Date().toISOString(),
                        companyLogo: j.company_logo,
                        latitude: coords.lat + jitterLat,
                        longitude: coords.lng + jitterLng
                    });
                });
                console.log(`Added ${jobs.length} Remotive ${cat} jobs.`);
            }
        } catch (e) {
            console.warn(`Remotive ${cat} fetch failed:`, e);
        }
    }

    // 3. Add our curated multi-continent global companies
    TECH_COMPANIES.forEach((c, idx) => {
        const coords = TECH_HUBS[c.hub] || TECH_HUBS['San Francisco'];
        const jitterLat = (Math.random() - 0.5) * 0.05;
        const jitterLng = (Math.random() - 0.5) * 0.05;

        allJobs.push({
            id: `capable-global-${idx + 1}`,
            source: 'CapAble Global Hubs',
            title: c.role,
            company: c.name,
            location: `${c.hub}, ${coords.country}`,
            remote: false,
            type: c.type,
            url: `https://www.google.com/search?q=${encodeURIComponent(c.name + ' careers ' + c.role)}`,
            description: c.desc,
            tags: c.tags,
            salary: c.salary,
            postedAt: new Date(Date.now() - (idx % 7) * 86400000).toISOString(),
            latitude: coords.lat + jitterLat,
            longitude: coords.lng + jitterLng
        });
    });

    console.log(`Total generated jobs: ${allJobs.length}`);
    writeFileSync(GLOBAL_JOBS_PATH, JSON.stringify(allJobs, null, 2), 'utf-8');
    console.log(`Successfully saved to ${GLOBAL_JOBS_PATH}`);
}

generateJobs().catch(console.error);
