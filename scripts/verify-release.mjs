if (process.env.RELEASE_MODE !== 'true') {
	throw new Error('Direct publishing is disabled. Publish a verified GitHub release instead.');
}
