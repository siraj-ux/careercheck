export interface CourseData {
  id: string;
  name: string;
  category: string;
  level: 'UG' | 'PG' | 'both';
}

export const COURSES_DATA: CourseData[] = [
  {
    "id": "crs-mbbs",
    "name": "MBBS",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bds",
    "name": "BDS",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bams",
    "name": "BAMS",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bhms",
    "name": "BHMS",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-nursing",
    "name": "BSc Nursing",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-general-nursing-and-midwifery",
    "name": "General Nursing and Midwifery",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-medical-imaging-technology",
    "name": "BSc Medical Imaging Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-anesthesia-and-operation-theatre-tec",
    "name": "BSc Anesthesia and Operation Theatre Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-perfusion-technology",
    "name": "BSc Perfusion Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-optometry",
    "name": "BSc Optometry",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-emergency-trauma-care",
    "name": "BSc Emergency Trauma Care",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-cardiac-care-technology",
    "name": "BSc Cardiac Care Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-cardiovascular-technology",
    "name": "BSc Cardiovascular Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-renal-dialysis-technology",
    "name": "BSc Renal Dialysis Technology",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bot-bachelor-of-occupational-therapy",
    "name": "BOT (Bachelor of Occupational Therapy)",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-baslp-bachelor-of-audiology-and-speech-l",
    "name": "BASLP (Bachelor of Audiology and Speech-Language Pathology)",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-neuroscience",
    "name": "BSc Neuroscience",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-nuclear-medicine",
    "name": "BSc Nuclear Medicine",
    "category": "Medical",
    "level": "UG"
  },
  {
    "id": "crs-bsc-food-technology",
    "name": "BSc Food Technology",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-bsc-microbiology",
    "name": "BSc Microbiology",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-bsc-biotechnology",
    "name": "BSc Biotechnology",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-bachelor-of-pharmacy",
    "name": "Bachelor of Pharmacy",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-diploma-in-pharmacy",
    "name": "Diploma in Pharmacy",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-pharmd",
    "name": "PharmD",
    "category": "Other BSc Courses",
    "level": "both"
  },
  {
    "id": "crs-bsc-nutrition-and-dietetics",
    "name": "BSc Nutrition and Dietetics",
    "category": "Other BSc Courses",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-mechanical-engineering",
    "name": "B.Tech in Mechanical Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-civil-engineering",
    "name": "B.Tech in Civil Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-electronics-and-communication-",
    "name": "B.Tech in Electronics and Communication Engineering (ECE)",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-electrical-and-electronics-eng",
    "name": "B.Tech in Electrical and Electronics Engineering (EEE)",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-aeronautical-engineering",
    "name": "B.Tech in Aeronautical Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-agricultural-engineering",
    "name": "B.Tech in Agricultural Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-food-technology",
    "name": "B.Tech in Food Technology",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-biotechnology",
    "name": "B.Tech in Biotechnology",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-artificial-intelligence-and-ma",
    "name": "B.Tech in Artificial Intelligence and Machine Learning (AI & ML)",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-computer-science-and-engineeri",
    "name": "B.Tech in Computer Science and Engineering (CSE)",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-cyber-security",
    "name": "B.Tech in Cyber Security",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-data-science",
    "name": "B.Tech in Data Science",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-very-large-scale-integration-v",
    "name": "B.Tech in Very Large Scale Integration (VLSI)",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-petroleum-engineering",
    "name": "B.Tech in Petroleum Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-petrochemical-engineering",
    "name": "B.Tech in Petrochemical Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-mechatronics-engineering",
    "name": "B.Tech in Mechatronics Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-b-tech-in-marine-engineering",
    "name": "B.Tech in Marine Engineering",
    "category": "Engineering",
    "level": "UG"
  },
  {
    "id": "crs-bca",
    "name": "BCA",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-artificial-intelligence-and-machi",
    "name": "BCA in Artificial Intelligence and Machine Learning (AI & ML)",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-cyber-security",
    "name": "BCA in Cyber Security",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-ethical-hacking",
    "name": "BCA in Ethical Hacking",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-data-science",
    "name": "BCA in Data Science",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-devops",
    "name": "BCA in DevOps",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-internet-of-things-iot",
    "name": "BCA in Internet of Things (IoT)",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-robotics-and-automation",
    "name": "BCA in Robotics and Automation",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-game-and-mobile-software-developm",
    "name": "BCA in Game and Mobile Software Development",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-full-stack-development",
    "name": "BCA in Full Stack Development",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-cloud-computing",
    "name": "BCA in Cloud Computing",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-augmented-reality-and-virtual-rea",
    "name": "BCA in Augmented Reality and Virtual Reality (AR/VR)",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-user-interface-and-user-experienc",
    "name": "BCA in User Interface and User Experience Design (UI/UX)",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bca-in-generative-artificial-intelligenc",
    "name": "BCA in Generative Artificial Intelligence (Gen AI)",
    "category": "BCA",
    "level": "UG"
  },
  {
    "id": "crs-bba",
    "name": "BBA",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-aviation-and-airport-management",
    "name": "BBA in Aviation and Airport Management",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-logistics",
    "name": "BBA in Logistics",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-travel-and-tourism-management",
    "name": "BBA in Travel and Tourism Management",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-sports-management",
    "name": "BBA in Sports Management",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-financial-technology-fintech",
    "name": "BBA in Financial Technology (FinTech)",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-business-analytics",
    "name": "BBA in Business Analytics",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-hospital-administration",
    "name": "BBA in Hospital Administration",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-digital-marketing",
    "name": "BBA in Digital Marketing",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-artificial-intelligence-and-data-",
    "name": "BBA in Artificial Intelligence and Data Science",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-data-analytics",
    "name": "BBA in Data Analytics",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-bba-in-international-business",
    "name": "BBA in International Business",
    "category": "BBA",
    "level": "UG"
  },
  {
    "id": "crs-b-com-bachelor-of-commerce",
    "name": "B.Com (Bachelor of Commerce)",
    "category": "Commerce",
    "level": "UG"
  },
  {
    "id": "crs-b-com-with-acca-association-of-chartered",
    "name": "B.Com with ACCA (Association of Chartered Certified Accountants)",
    "category": "Commerce",
    "level": "UG"
  },
  {
    "id": "crs-b-com-with-ca-chartered-accountancy",
    "name": "B.Com with CA (Chartered Accountancy)",
    "category": "Commerce",
    "level": "UG"
  },
  {
    "id": "crs-bhm-bachelor-of-hotel-management",
    "name": "BHM (Bachelor of Hotel Management)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-ba-multimedia-bachelor-of-arts-in-multim",
    "name": "BA Multimedia (Bachelor of Arts in Multimedia)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-b-arch-bachelor-of-architecture",
    "name": "B.Arch (Bachelor of Architecture)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-bsc-fashion-technology-bachelor-of-scien",
    "name": "BSc Fashion Technology (Bachelor of Science in Fashion Technology)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-bsw-bachelor-of-social-work",
    "name": "BSW (Bachelor of Social Work)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-ba-journalism-and-mass-communication-bac",
    "name": "BA Journalism and Mass Communication (Bachelor of Arts in Journalism and Mass Communication)",
    "category": "Other Degree Courses",
    "level": "UG"
  },
  {
    "id": "crs-bttm-bachelor-of-tourism-and-travel-mana",
    "name": "BTTM (Bachelor of Tourism and Travel Management)",
    "category": "Other Degree Courses",
    "level": "UG"
  }
];
