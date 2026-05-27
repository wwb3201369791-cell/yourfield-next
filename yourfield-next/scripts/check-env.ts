async function main() {
  try {
    await import('../src/lib/env');
    console.info('Environment validation passed.');
  } catch (error) {
    console.error('Environment validation failed.');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exitCode = 1;
  }
}

void main();
