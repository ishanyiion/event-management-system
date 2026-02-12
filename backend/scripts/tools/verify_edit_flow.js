const API_URL = 'http://localhost:5000/api';

async function testFlow() {
    try {
        console.log('--- STARTING FLOW VERIFICATION (FINAL HEADERS) ---');

        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@eventify.com', password: 'admin123' })
        });
        const adminLogin = await adminLoginRes.json();
        const adminToken = adminLogin.token;
        if (!adminToken) throw new Error('Admin login failed');
        console.log('Admin Logged In');

        const orgLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'priya.events@gmail.com', password: 'priya123' })
        });
        const orgLogin = await orgLoginRes.json();
        const orgToken = orgLogin.token;
        if (!orgToken) throw new Error('Organizer login failed');
        console.log('Organizer Logged In');

        const eventsRes = await fetch(`${API_URL}/events/my`, {
            headers: { 'x-auth-token': orgToken }
        });
        const events = await eventsRes.json();

        if (!Array.isArray(events)) {
            console.log('Events response:', events);
            throw new Error('Events response is not an array');
        }

        const approvedEvent = events.find(e => e.status === 'APPROVED');
        if (!approvedEvent) {
            console.log('No approved event found to test.');
            return;
        }
        console.log(`Found Approved Event: ${approvedEvent.title} (ID: ${approvedEvent.id})`);

        // 4. Submit Proposed Update DIRECTLY (Consolidated Flow)
        const newTitle = `STREAMLINED: ${approvedEvent.title} (REF: ${Date.now()})`;
        const submitRes = await fetch(`${API_URL}/events/update/${approvedEvent.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': orgToken
            },
            body: JSON.stringify({
                title: newTitle,
                description: 'New proposed description via test script'
            })
        });
        const submitResult = await submitRes.json();
        console.log('Proposed changes submitted by Organizer:', submitResult.message);

        const checkRes = await fetch(`${API_URL}/events/${approvedEvent.id}`);
        const checkEvent = await checkRes.json();
        console.log('Verification After Submission:');
        console.log('- Status:', checkEvent.status);
        console.log('- Edit Permission:', checkEvent.edit_permission);
        console.log('- Title (Live):', checkEvent.title);

        // Check if excluded from Approved List
        const adminApprovedRes = await fetch(`${API_URL}/admin/events/approved`, {
            headers: { 'x-auth-token': adminToken }
        });
        const approvedList = await adminApprovedRes.json();
        const foundInApproved = approvedList.find(e => e.id === approvedEvent.id);

        console.log('- Excluded from Approved List:', !foundInApproved ? 'YES (Correct)' : 'NO (Failure)');

        if (foundInApproved) {
            throw new Error('FAILURE: Event still shows in Approved list while under review!');
        }

        if (checkEvent.title === newTitle) {
            throw new Error('FAILURE: Live title was updated immediately!');
        }

        const approveRes = await fetch(`${API_URL}/events/approve-update/${approvedEvent.id}`, {
            method: 'PUT',
            headers: { 'x-auth-token': adminToken }
        });
        const approveResult = await approveRes.json();
        console.log('Updates Approved by Admin:', approveResult.message);

        const finalRes = await fetch(`${API_URL}/events/${approvedEvent.id}`);
        const finalEvent = await finalRes.json();
        console.log('Verification After Approval:');
        console.log('- Status:', finalEvent.status);
        console.log('- Title:', finalEvent.title);

        if (finalEvent.title !== newTitle) {
            throw new Error('FAILURE: Live title was not updated!');
        }

        console.log('--- VERIFICATION SUCCESSFUL ---');
    } catch (err) {
        console.error('VERIFICATION FAILED:', err.message);
    }
}

testFlow();
