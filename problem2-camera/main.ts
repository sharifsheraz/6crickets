interface CameraRange {
  min: number;
  max: number;
}

interface CameraSpec {
  distance: CameraRange;
  lightLevel: CameraRange;
}

function canCoverRequirements(
  softwareCamera: CameraSpec,
  hardwareCameras: CameraSpec[],
): boolean {
  if (hardwareCameras.length === 0) return false;

  const hasInvalidRange = ({ distance, lightLevel }: CameraSpec) =>
    distance.min > distance.max || lightLevel.min > lightLevel.max;

  if (hasInvalidRange(softwareCamera) || hardwareCameras.some(hasInvalidRange))
    return false;

  const allCameras = [softwareCamera, ...hardwareCameras];

  const distanceBounds = getBoundaries(
    allCameras.map((c) => c.distance),
  ).filter((b) => isPointInRange(b, softwareCamera.distance));

  const lightBounds = getBoundaries(allCameras.map((c) => c.lightLevel)).filter(
    (b) => isPointInRange(b, softwareCamera.lightLevel),
  );

  for (const cellDist of getCellMidpoints(distanceBounds)) {
    for (const cellLight of getCellMidpoints(lightBounds)) {
      const isCovered = hardwareCameras.some(
        (c) =>
          isPointInRange(cellDist, c.distance) &&
          isPointInRange(cellLight, c.lightLevel),
      );
      if (!isCovered) {
        return false;
      }
    }
  }

  return true;
}

function getBoundaries(ranges: CameraRange[]): number[] {
  const boundaries = new Set<number>();

  for (const range of ranges) {
    boundaries.add(range.min);
    boundaries.add(range.max);
  }

  return Array.from(boundaries).sort((a, b) => a - b);
}

function getCellMidpoints(bounds: number[]): number[] {
  if (bounds.length <= 1) return bounds;
  return bounds.slice(1).map((b, i) => (bounds[i] + b) / 2);
}

function isPointInRange(point: number, range: CameraRange): boolean {
  return point >= range.min && point <= range.max;
}

function runTests() {
  const tests = [
    {
      name: "Single camera exact match",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "No hardware cameras",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [],
      expected: false,
    },
    {
      name: "Two cameras covering horizontally",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 5 }, lightLevel: { min: 0, max: 100 } },
        { distance: { min: 5, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Two cameras covering vertically",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 50 } },
        { distance: { min: 0, max: 10 }, lightLevel: { min: 50, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Gap in coverage",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 4 }, lightLevel: { min: 0, max: 100 } },
        { distance: { min: 6, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: false,
    },
    {
      name: "Four cameras in quarter coverage",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 5 }, lightLevel: { min: 0, max: 50 } },
        { distance: { min: 5, max: 10 }, lightLevel: { min: 0, max: 50 } },
        { distance: { min: 0, max: 5 }, lightLevel: { min: 50, max: 100 } },
        { distance: { min: 5, max: 10 }, lightLevel: { min: 50, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Overlapping cameras",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 7 }, lightLevel: { min: 0, max: 100 } },
        { distance: { min: 3, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Hardware camera larger than software requirement",
      software: {
        distance: { min: 2, max: 8 },
        lightLevel: { min: 20, max: 80 },
      },
      hardware: [
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Single-point software range (covered)",
      software: {
        distance: { min: 5, max: 5 },
        lightLevel: { min: 50, max: 50 },
      },
      hardware: [
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: true,
    },
    {
      name: "Single-point software range (not covered)",
      software: {
        distance: { min: 5, max: 5 },
        lightLevel: { min: 50, max: 50 },
      },
      hardware: [
        { distance: { min: 0, max: 3 }, lightLevel: { min: 0, max: 30 } },
      ],
      expected: false,
    },
    {
      name: "Inverted software range",
      software: {
        distance: { min: 10, max: 0 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: false,
    },
    {
      name: "Inverted hardware range",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 100 },
      },
      hardware: [
        { distance: { min: 10, max: 0 }, lightLevel: { min: 0, max: 100 } },
      ],
      expected: false,
    },
    {
      name: "Missing corner coverage",
      software: {
        distance: { min: 0, max: 10 },
        lightLevel: { min: 0, max: 10 },
      },
      hardware: [
        { distance: { min: 0, max: 9 }, lightLevel: { min: 0, max: 10 } },
        { distance: { min: 0, max: 10 }, lightLevel: { min: 0, max: 9 } },
      ],
      expected: false,
    },
  ];

  console.log("Running camera coverage tests...\n");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = canCoverRequirements(test.software, test.hardware);
    const status = result === test.expected ? "PASS" : "FAIL";

    console.log(`${status}: ${test.name}`);
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
      console.log(`  Expected: ${test.expected}, Got: ${result}\n`);
    }
  }

  console.log(
    `\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`,
  );
}

runTests();
