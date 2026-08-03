import { driver, closeDriver } from '../config/db';

async function seed() {
  const session = driver.session();
  try {
    console.log('Clearing database...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Seeding Nodes...');
    await session.run(`
      CREATE 
        // Skills (Frontend)
        (react:Skill {id: 'react', name: 'React', type: 'frontend'}),
        (vue:Skill {id: 'vue', name: 'Vue', type: 'frontend'}),
        (html:Skill {id: 'html', name: 'HTML/CSS', type: 'frontend'}),
        (tailwind:Skill {id: 'tailwind', name: 'Tailwind CSS', type: 'frontend'}),
        (ts:Skill {id: 'ts', name: 'TypeScript', type: 'language'}),
        (js:Skill {id: 'js', name: 'JavaScript', type: 'language'}),
        
        // Skills (Backend)
        (node:Skill {id: 'node', name: 'Node.js', type: 'backend'}),
        (express:Skill {id: 'express', name: 'Express', type: 'backend'}),
        (nest:Skill {id: 'nest', name: 'NestJS', type: 'backend'}),
        (python:Skill {id: 'python', name: 'Python', type: 'language'}),
        (django:Skill {id: 'django', name: 'Django', type: 'backend'}),
        
        // Skills (Database)
        (mongo:Skill {id: 'mongo', name: 'MongoDB', type: 'database'}),
        (postgres:Skill {id: 'postgres', name: 'PostgreSQL', type: 'database'}),
        (redis:Skill {id: 'redis', name: 'Redis', type: 'database'}),
        (neo4j:Skill {id: 'neo4j', name: 'Neo4j', type: 'database'}),
        
        // Skills (DevOps / Infrastructure)
        (docker:Skill {id: 'docker', name: 'Docker', type: 'devops'}),
        (k8s:Skill {id: 'k8s', name: 'Kubernetes', type: 'devops'}),
        (aws:Skill {id: 'aws', name: 'AWS', type: 'devops'}),
        (linux:Skill {id: 'linux', name: 'Linux', type: 'devops'}),
        
        // Roles
        (fe_eng:Role {id: 'fe_eng', title: 'Frontend Engineer'}),
        (be_eng:Role {id: 'be_eng', title: 'Backend Engineer'}),
        (fs_eng:Role {id: 'fs_eng', title: 'Fullstack Engineer'}),
        (devops_eng:Role {id: 'devops_eng', title: 'DevOps Engineer'}),
        (platform_eng:Role {id: 'platform_eng', title: 'Platform Engineer'}),
        
        // Companies
        (netflix:Company {id: 'netflix', name: 'Netflix'}),
        (uber:Company {id: 'uber', name: 'Uber'}),
        (spotify:Company {id: 'spotify', name: 'Spotify'}),
        (stripe:Company {id: 'stripe', name: 'Stripe'})
        
      WITH * 
      
      // Relationships
      
      // Prerequisites
      CREATE (js)-[:PREREQUISITE_OF]->(ts)
      CREATE (js)-[:PREREQUISITE_OF]->(react)
      CREATE (js)-[:PREREQUISITE_OF]->(vue)
      CREATE (js)-[:PREREQUISITE_OF]->(node)
      CREATE (html)-[:PREREQUISITE_OF]->(react)
      CREATE (node)-[:PREREQUISITE_OF]->(express)
      CREATE (node)-[:PREREQUISITE_OF]->(nest)
      CREATE (python)-[:PREREQUISITE_OF]->(django)
      CREATE (linux)-[:PREREQUISITE_OF]->(docker)
      CREATE (docker)-[:PREREQUISITE_OF]->(k8s)
      
      // Used With
      CREATE (react)-[:USED_WITH]->(tailwind)
      CREATE (react)-[:USED_WITH]->(ts)
      CREATE (node)-[:USED_WITH]->(express)
      CREATE (node)-[:USED_WITH]->(mongo)
      CREATE (node)-[:USED_WITH]->(postgres)
      CREATE (django)-[:USED_WITH]->(postgres)
      CREATE (express)-[:USED_WITH]->(redis)
      CREATE (express)-[:USED_WITH]->(mongo)
      
      // Used In (Roles)
      CREATE (react)-[:USED_IN]->(fe_eng)
      CREATE (vue)-[:USED_IN]->(fe_eng)
      CREATE (tailwind)-[:USED_IN]->(fe_eng)
      CREATE (ts)-[:USED_IN]->(fe_eng)
      
      CREATE (node)-[:USED_IN]->(be_eng)
      CREATE (python)-[:USED_IN]->(be_eng)
      CREATE (postgres)-[:USED_IN]->(be_eng)
      CREATE (redis)-[:USED_IN]->(be_eng)
      
      CREATE (react)-[:USED_IN]->(fs_eng)
      CREATE (node)-[:USED_IN]->(fs_eng)
      CREATE (ts)-[:USED_IN]->(fs_eng)
      CREATE (postgres)-[:USED_IN]->(fs_eng)
      
      CREATE (linux)-[:USED_IN]->(devops_eng)
      CREATE (docker)-[:USED_IN]->(devops_eng)
      CREATE (k8s)-[:USED_IN]->(devops_eng)
      CREATE (aws)-[:USED_IN]->(devops_eng)
      
      CREATE (docker)-[:USED_IN]->(platform_eng)
      CREATE (k8s)-[:USED_IN]->(platform_eng)
      CREATE (aws)-[:USED_IN]->(platform_eng)
      CREATE (ts)-[:USED_IN]->(platform_eng)
      
      // Hired By (Companies)
      CREATE (fe_eng)-[:HIRED_BY]->(netflix)
      CREATE (be_eng)-[:HIRED_BY]->(netflix)
      CREATE (platform_eng)-[:HIRED_BY]->(netflix)
      
      CREATE (be_eng)-[:HIRED_BY]->(uber)
      CREATE (devops_eng)-[:HIRED_BY]->(uber)
      
      CREATE (fe_eng)-[:HIRED_BY]->(spotify)
      CREATE (fs_eng)-[:HIRED_BY]->(spotify)
      
      CREATE (fs_eng)-[:HIRED_BY]->(stripe)
      CREATE (be_eng)-[:HIRED_BY]->(stripe)
    `);

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed();
