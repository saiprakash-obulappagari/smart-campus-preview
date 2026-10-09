function notFound(req, res) {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
}


function errorHandler(err, req, res, next) {

    console.error('Request failed:', err.code || err.type || err.name || 'UNKNOWN');

    const invalidJson = err.type === 'entity.parse.failed';
    const tooLarge = err.type === 'entity.too.large';
    const unavailable = ['ECONNREFUSED','PROTOCOL_CONNECTION_LOST','ER_CON_COUNT_ERROR','ETIMEDOUT'].includes(err.code);
    res.status(invalidJson ? 400 : tooLarge ? 413 : unavailable ? 503 : 500).json({
        success: false,
        message: invalidJson ? 'Invalid JSON request body.' : tooLarge ? 'Request is too large. Use a smaller import batch.' : unavailable ? 'The database is temporarily unavailable. Try again shortly.' : 'Internal server error'
    });
}


module.exports = {
    notFound,
    errorHandler
};
