const http = require('http');
http.get('http://localhost:5000/api/merit', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        const lists = JSON.parse(data);
        console.log(lists.map(l => ({ id: l._id, dept: l.department, status: l.status, length: l.students?.length, gender: l.students?.[0]?.gender })));
    });
});
