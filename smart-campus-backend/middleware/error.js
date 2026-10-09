function notFound(req, res) {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
}


function errorHandler(err, req, res, next) {

    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}


module.exports = {
    notFound,
    errorHandler
};