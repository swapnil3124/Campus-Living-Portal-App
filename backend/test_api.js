const http = require('http');

http.get('http://localhost:5000/api/rooms?hostelName=Lenyadri%20Hostel', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const rooms = JSON.parse(data);
        const r401 = rooms.find(r => r.roomNumber === '401');
        if (r401) {
            console.log('Room 401 found:', r401.roomNumber);
            const booked = r401.beds.filter(b => b.isBooked);
            console.log('Booked beds:', booked.length);
            booked.forEach(b => console.log(`  - ${b.studentName} (Bed ${b.bedNumber})`));
        } else {
            console.log('Room 401 NOT found for Lenyadri Hostel');
        }
    });
});
