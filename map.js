// ══════════════════════════════════════════
// js/map.js  —  Map / World Generation
// Builds the Three.js scene: ground, sky,
// lighting, trees, rocks, buildings.
// ══════════════════════════════════════════

class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = []; // { mesh, radius } — used for collision
    this._build();
  }

  _build() {
    this._addSky();
    this._addLighting();
    this._addGround();
    this._addBoundaryWalls();
    this._addTrees();
    this._addRocks();
    this._addBuildings();
    this._addZoneCircleVisual();
  }

  // ── SKY (gradient fog) ──────────────────
  _addSky() {
    this.scene.background = new THREE.Color(0x4a7fa5);
    this.scene.fog = new THREE.Fog(0x4a7fa5, 60, 180);
  }

  // ── LIGHTING ────────────────────────────
  _addLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far  = 400;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -200;
    sun.shadow.camera.right = sun.shadow.camera.top   =  200;
    this.scene.add(sun);

    // Fill light from sky
    const fill = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
    this.scene.add(fill);
  }

  // ── GROUND ──────────────────────────────
  _addGround() {
    const geo = new THREE.PlaneGeometry(
      CONFIG.MAP_SIZE * 2,
      CONFIG.MAP_SIZE * 2,
      40, 40
    );

    // Slightly undulate the ground for visual interest
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i);
      // Keep centre flat, undulate edges
      const d = Math.sqrt(x * x + z * z) / CONFIG.MAP_SIZE;
      pos.setZ(i, Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5 * d);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Road cross — purely cosmetic
    this._addRoads();
  }

  _addRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    // Horizontal road
    const h = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.MAP_SIZE * 2, 8), roadMat);
    h.rotation.x = -Math.PI / 2;
    h.position.y = 0.01;
    this.scene.add(h);
    // Vertical road
    const v = new THREE.Mesh(new THREE.PlaneGeometry(8, CONFIG.MAP_SIZE * 2), roadMat);
    v.rotation.x = -Math.PI / 2;
    v.position.y = 0.01;
    this.scene.add(v);
  }

  // ── BOUNDARY WALLS (invisible) ──────────
  _addBoundaryWalls() {
    // These are invisible — the zone circle is the real boundary.
    // But add a small raised edge so player feels it.
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x2a5a2a, side: THREE.BackSide });
    const S = CONFIG.MAP_SIZE;
    const walls = [
      { pos: [0, 1, -S], rot: [0,0,0],            size: [S*2, 2, 1] },
      { pos: [0, 1,  S], rot: [0, Math.PI, 0],    size: [S*2, 2, 1] },
      { pos: [-S,1, 0],  rot: [0, Math.PI/2, 0],  size: [S*2, 2, 1] },
      { pos: [ S,1, 0],  rot: [0,-Math.PI/2, 0],  size: [S*2, 2, 1] },
    ];
    walls.forEach(w => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
      m.position.set(...w.pos);
      m.rotation.set(...w.rot);
      this.scene.add(m);
    });
  }

  // ── TREES ───────────────────────────────
  _addTrees() {
    for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
      const { x, z } = this._randPos(10);
      this._placeTree(x, z);
    }
  }

  _placeTree(x, z) {
    const group = new THREE.Group();
    const height = 4 + Math.random() * 3;

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.35, height, 6),
      new THREE.MeshLambertMaterial({ color: 0x5c3d1e })
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage layers
    const foliageColor = new THREE.Color().setHSL(0.3 + Math.random()*0.05, 0.6, 0.25 + Math.random()*0.1);
    const foliageMat = new THREE.MeshLambertMaterial({ color: foliageColor });
    [0, 1, 1.8].forEach((offset, i) => {
      const r = 2.2 - i * 0.5;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(r, 2.5, 7),
        foliageMat
      );
      cone.position.y = height * 0.6 + offset * 1.5;
      cone.castShadow = true;
      group.add(cone);
    });

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(group);

    // Register obstacle (trunk collision only)
    this.obstacles.push({ mesh: group, x, z, radius: 0.6 });
  }

  // ── ROCKS ───────────────────────────────
  _addRocks() {
    for (let i = 0; i < CONFIG.ROCK_COUNT; i++) {
      const { x, z } = this._randPos(8);
      this._placeRock(x, z);
    }
  }

  _placeRock(x, z) {
    const scale = 0.6 + Math.random() * 1.4;
    const geo = new THREE.DodecahedronGeometry(scale, 0);

    // Warp vertices for organic look
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i,
        pos.getX(i) * (0.85 + Math.random() * 0.3),
        pos.getY(i) * (0.85 + Math.random() * 0.3),
        pos.getZ(i) * (0.85 + Math.random() * 0.3)
      );
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ color: 0x808080 + Math.floor(Math.random()*0x101010) });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, scale * 0.5, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);

    this.obstacles.push({ mesh: rock, x, z, radius: scale * 0.8 });
  }

  // ── BUILDINGS ───────────────────────────
  _addBuildings() {
    for (let i = 0; i < CONFIG.BUILDING_COUNT; i++) {
      const { x, z } = this._randPos(15);
      this._placeBuilding(x, z);
    }
  }

  _placeBuilding(x, z) {
    const w = 5 + Math.random() * 8;
    const d = 5 + Math.random() * 8;
    const h = 3 + Math.random() * 6;

    const group = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
    );
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4),
      new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
    );
    roof.position.y = h + 0.2;
    roof.castShadow = true;
    group.add(roof);

    // Windows (purely cosmetic quads)
    const winMat = new THREE.MeshLambertMaterial({ color: 0xaaccff, emissive: 0x224488 });
    for (let r = 0; r < Math.floor(h / 2); r++) {
      for (let c = 0; c < Math.floor(w / 2.5); c++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), winMat);
        win.position.set(-w/2 + 1.5 + c * 2.2, 1.2 + r * 2, d / 2 + 0.01);
        group.add(win);
      }
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(group);

    this.obstacles.push({ mesh: group, x, z, radius: Math.max(w, d) * 0.7 });
  }

  // ── ZONE VISUAL (blue ring on ground) ───
  _addZoneCircleVisual() {
    // A thin ring mesh that shrinks with the zone
    const ringGeo = new THREE.RingGeometry(
      CONFIG.ZONE_START_RADIUS - 0.5,
      CONFIG.ZONE_START_RADIUS,
      64
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff, side: THREE.DoubleSide, transparent: true, opacity: 0.5
    });
    this.zoneRing = new THREE.Mesh(ringGeo, ringMat);
    this.zoneRing.rotation.x = -Math.PI / 2;
    this.zoneRing.position.y = 0.1;
    this.scene.add(this.zoneRing);
  }

  // Update zone ring radius
  updateZoneVisual(radius) {
    // Rebuild geometry
    this.zoneRing.geometry.dispose();
    this.zoneRing.geometry = new THREE.RingGeometry(
      Math.max(0, radius - 0.5), radius, 64
    );
  }

  // ── UTILITY ─────────────────────────────
  _randPos(minDist) {
    const S = CONFIG.MAP_SIZE - 10;
    let x, z, attempts = 0;
    do {
      x = (Math.random() * 2 - 1) * S;
      z = (Math.random() * 2 - 1) * S;
      attempts++;
    } while (
      Math.sqrt(x * x + z * z) < minDist && attempts < 50
    );
    return { x, z };
  }

  // Check if a position collides with any obstacle
  checkCollision(x, z, radius) {
    for (const obs of this.obstacles) {
      const dx = x - obs.x;
      const dz = z - obs.z;
      if (Math.sqrt(dx * dx + dz * dz) < radius + obs.radius) {
        return true;
      }
    }
    return false;
  }
}
