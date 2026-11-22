export interface NetworkTestResult {
  status: 'Online' | 'Offline'
  latency: number | null
  packetLoss: number
  testedAt: string
}

export interface SpeedTestResult {
  downloadMbps: number | null
  uploadMbps: number | null
  testedAt: string
}

export async function testInternet(): Promise<NetworkTestResult> {
  const totalTests = 5
  const results: number[] = []
  let failedTests = 0

  for (let i = 0; i < totalTests; i++) {
    const start = performance.now()

    try {
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })

      const elapsed = Math.round(performance.now() - start)
      results.push(elapsed)
    } catch {
      failedTests++
    }
  }

  const latency =
    results.length > 0
      ? Math.round(
          results.reduce((total, value) => total + value, 0) /
            results.length,
        )
      : null

  const packetLoss = Math.round((failedTests / totalTests) * 100)

  return {
    status: results.length > 0 ? 'Online' : 'Offline',
    latency,
    packetLoss,
    testedAt: new Date().toISOString(),
  }
}

export async function testSpeed(): Promise<SpeedTestResult> {
  let downloadMbps: number | null = null
  let uploadMbps: number | null = null

  // Download speed test: download approximately 1 MB
  try {
    const downloadSize = 1_000_000
    const start = performance.now()

    const response = await fetch(
      `https://speed.cloudflare.com/__down?bytes=${downloadSize}&cacheBust=${Date.now()}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      },
    )

    if (!response.ok) {
      throw new Error('Download test failed')
    }

    const data = await response.arrayBuffer()
    const duration = (performance.now() - start) / 1000

    if (duration > 0) {
      downloadMbps = Number(
        ((data.byteLength * 8) / duration / 1_000_000).toFixed(2),
      )
    }
  } catch (error) {
    console.warn('Download speed test failed:', error)
  }

  // Upload speed test: upload approximately 1 MB of data
  try {
    const uploadSize = 1_000_000
    const uploadData = new Uint8Array(uploadSize)
    crypto.getRandomValues(uploadData.subarray(0, 65536))

    // Fill the remaining bytes without exceeding crypto's size limit
    for (let i = 65536; i < uploadSize; i += 65536) {
      const end = Math.min(i + 65536, uploadSize)
      crypto.getRandomValues(uploadData.subarray(i, end))
    }

    const start = performance.now()

    const response = await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body: uploadData,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error('Upload test failed')
    }

    const duration = (performance.now() - start) / 1000

    if (duration > 0) {
      uploadMbps = Number(
        ((uploadSize * 8) / duration / 1_000_000).toFixed(2),
      )
    }
  } catch (error) {
    console.warn('Upload speed test failed:', error)
  }

  return {
    downloadMbps,
    uploadMbps,
    testedAt: new Date().toISOString(),
  }
}