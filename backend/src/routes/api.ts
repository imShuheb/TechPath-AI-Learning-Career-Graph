import { Router } from 'express';
import { driver } from '../config/db';

const router = Router();

const formatNode = (node: any) => ({
  id: node.properties.id,
  name: node.properties.name || node.properties.title,
  type: node.properties.type || node.labels[0].toLowerCase(),
  label: node.labels[0]
});

router.get('/graph', async (req, res) => {
  const session = driver.session();
  try {
    const nodesRes = await session.run('MATCH (n) RETURN n');
    const linksRes = await session.run('MATCH (s)-[r]->(t) RETURN s.id AS source, t.id AS target, type(r) AS type');

    const nodes = nodesRes.records.map((r) => formatNode(r.get('n')));
    const links = linksRes.records.map((r) => ({
      source: r.get('source'),
      target: r.get('target'),
      type: r.get('type')
    }));

    res.json({ nodes, links });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch graph' });
  } finally {
    await session.close();
  }
});

router.get('/skills', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (s:Skill) RETURN s.id AS id, s.name AS name');
    res.json(result.records.map(r => ({ id: r.get('id'), name: r.get('name') })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  } finally {
    await session.close();
  }
});

router.post('/recommendations', async (req, res) => {
  const { knownSkills } = req.body;
  if (!knownSkills || !knownSkills.length) {
    res.json([]);
    return;
  }

  const session = driver.session();
  try {
    const query = `
      MATCH (known:Skill) WHERE known.id IN $knownSkills
      MATCH (known)-[:PREREQUISITE_OF|USED_WITH]-(next:Skill)
      WHERE NOT next.id IN $knownSkills
      OPTIONAL MATCH (next)-[:USED_IN]->(role:Role)
      RETURN next, count(DISTINCT known) as connections, collect(DISTINCT role.title) as unlocksRoles
      ORDER BY connections DESC LIMIT 5
    `;
    const result = await session.run(query, { knownSkills });
    const recommendations = result.records.map(r => ({
      skill: formatNode(r.get('next')),
      connections: r.get('connections').toNumber(),
      unlocksRoles: r.get('unlocksRoles')
    }));
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  } finally {
    await session.close();
  }
});

router.get('/node/:id', async (req, res) => {
  const { id } = req.params;
  const session = driver.session();
  try {
    const nodeRes = await session.run('MATCH (n {id: $id}) RETURN n', { id });
    if (!nodeRes.records.length) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    const node = formatNode(nodeRes.records[0].get('n'));

    let details: any = {};
    if (node.label === 'Skill') {
      const reqRes = await session.run('MATCH (req:Skill)-[:PREREQUISITE_OF]->(s:Skill {id: $id}) RETURN req', { id });
      const leadsRes = await session.run('MATCH (s:Skill {id: $id})-[:PREREQUISITE_OF]->(leads:Skill) RETURN leads', { id });
      const rolesRes = await session.run('MATCH (s:Skill {id: $id})-[:USED_IN]->(r:Role) RETURN r', { id });

      details.requires = reqRes.records.map(r => formatNode(r.get('req')));
      details.leadsTo = leadsRes.records.map(r => formatNode(r.get('leads')));
      details.usedInRoles = rolesRes.records.map(r => formatNode(r.get('r')));
    } else if (node.label === 'Role') {
      const skillsRes = await session.run('MATCH (s:Skill)-[:USED_IN]->(r:Role {id: $id}) RETURN s', { id });
      const companiesRes = await session.run('MATCH (r:Role {id: $id})-[:HIRED_BY]->(c:Company) RETURN c', { id });
      details.requiredSkills = skillsRes.records.map(r => formatNode(r.get('s')));
      details.hiredBy = companiesRes.records.map(r => formatNode(r.get('c')));
    } else if (node.label === 'Company') {
      const rolesRes = await session.run('MATCH (r:Role)-[:HIRED_BY]->(c:Company {id: $id}) RETURN r', { id });
      details.hiringRoles = rolesRes.records.map(r => formatNode(r.get('r')));
    }

    res.json({ node, details });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch node details' });
  } finally {
    await session.close();
  }
});

router.get('/path/:skillId/:roleId', async (req, res) => {
  const { skillId, roleId } = req.params;
  const session = driver.session();
  try {
    const query = `
      MATCH (start:Skill {id: $skillId}), (end:Role {id: $roleId})
      MATCH path = shortestPath((start)-[*]-(end))
      RETURN [n in nodes(path) | n] as nodes, [r in relationships(path) | type(r)] as rels
    `;
    const result = await session.run(query, { skillId, roleId });
    if (!result.records.length) {
      res.json({ path: null });
      return;
    }

    const nodes = result.records[0].get('nodes').map((n: any) => formatNode(n));
    const rels = result.records[0].get('rels');

    const formattedPath = [];
    for (let i = 0; i < nodes.length; i++) {
      formattedPath.push({ type: 'node', data: nodes[i] });
      if (i < rels.length) {
        formattedPath.push({ type: 'rel', data: rels[i] });
      }
    }
    res.json({ path: formattedPath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch path' });
  } finally {
    await session.close();
  }
});

export default router;
