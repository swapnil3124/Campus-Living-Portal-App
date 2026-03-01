const http = require('http');
http.get('http://localhost:5000/api/merit', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        const lists = JSON.parse(data);
        const statuses = {};
        lists.forEach(l => {
            statuses[l.status] = (statuses[l.status] || 0) + 1;
        });
        console.log('Statuses:', statuses);

        // see who sent to rector
        const sent = lists.filter(l => l.status === 'sent_to_rector');
        console.log('Sent to rector details:', sent.map(l => ({ id: l._id, dept: l.department })));
    });
});
