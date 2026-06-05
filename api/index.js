import app from "./app.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
    console.log(`   - API base URL: http://localhost:${app.get('port')}/api`)
})