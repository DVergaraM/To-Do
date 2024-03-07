const app = require('express')()

function keepAlive() {
    app.get('/', (_, res) => {
        res.send('Hello World', 5, 5)
    })
    app.listen(3000)
}

module.exports = {
    keepAlive
}