async function main() {
  const url = 'https://jkptfxewwzazpvdslhna.supabase.co/storage/v1/object/public/models/1781609113878-1x6zjyq.glb';
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const chunkLength = buffer.readUInt32LE(12);
    const jsonString = buffer.toString('utf-8', 20, 20 + chunkLength);
    const gltf = JSON.parse(jsonString);
    
    console.log("Accessors count:", gltf.accessors?.length);
    console.log("Buffer views count:", gltf.bufferViews?.length);
    
    // Find POSITION accessors for meshes
    gltf.meshes.forEach((mesh: any, meshIdx: number) => {
      console.log(`\nMesh ${meshIdx} (${mesh.name}):`);
      mesh.primitives.forEach((prim: any, primIdx: number) => {
        const posAccessorIdx = prim.attributes.POSITION;
        const accessor = gltf.accessors[posAccessorIdx];
        console.log(`  Primitive ${primIdx}:`);
        console.log(`    Position Accessor Index: ${posAccessorIdx}`);
        console.log(`    Type: ${accessor.type}`);
        console.log(`    Component Type: ${accessor.componentType}`);
        console.log(`    Count: ${accessor.count}`);
        console.log(`    Min:`, accessor.min);
        console.log(`    Max:`, accessor.max);
      });
    });
    
  } catch (err) {
    console.error("Error:", err);
  }
}

main().catch(console.error);
