// DOM elements for Admin Auth
const adminAuthSection = document.getElementById('auth-section');
const adminLoginView = document.getElementById('admin-login-view');
const adminEmailInput = document.getElementById('adminEmailInput');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminLoginError = document.getElementById('admin-login-error');

// DOM elements for Admin App
const adminAppSection = document.getElementById('admin-app-section');
const adminLogoutButton = document.getElementById('adminLogoutButton');
const userTableBody = document.getElementById('userTableBody');
const adminStatusMessage = document.getElementById('adminStatusMessage');
const userSearchInput = document.getElementById('userSearchInput');

// DOM elements for Edit User Modal
const editUserModal = document.getElementById('editUserModal');
const editUserError = document.getElementById('editUserError');
const editDisplayName = document.getElementById('editDisplayName');
const editEmail = document.getElementById('editEmail');
const editGender = document.getElementById('editGender');
const editAge = document.getElementById('editAge');
const editCountry = document.getElementById('editCountry');
const editBio = document.getElementById('editBio');
const editSignupDate = document.getElementById('editSignupDate');
const saveUserChangesButton = document.getElementById('saveUserChanges');
const closeEditModalButton = document.getElementById('closeEditModal');
const editState = document.getElementById('editState');
const editCity = document.getElementById('editCity');

// Global variables
let editingUserUid = null;
let allUsersData = []; // To store all users for searching

// --- Admin Authentication ---
const ADMIN_EMAIL = "admin@chat.com";
const ADMIN_UID = "l1ztgp6IeJQPUaiSluVHmVYs6hv2";

adminLoginButton.addEventListener('click', async () => {
    const email = adminEmailInput.value.trim();
    const password = adminPasswordInput.value.trim();
    adminLoginError.textContent = '';

    if (!email || !password) {
        adminLoginError.textContent = 'တဲမ်းသော့ꩻဖေႏ အီးမေး တွမ်ႏ ငဝ်းပလို့ꩻ ဟုဲင်းဩ။';
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (userCredential.user.uid === ADMIN_UID) {
            console.log("Admin login successful!");
            adminAuthSection.classList.add('hidden');
            adminAppSection.classList.remove('hidden');
            loadAllUsers();
        } else {
            await auth.signOut();
            adminLoginError.textContent = 'နွို့ ဖန်းဖြယ်ခွင်ꩻ တရာꩻဝင်ႏတဝ်းသွူ';
        }
    } catch (error) {
        console.error("Admin Login Error:", error.code, error.message);
        adminLoginError.textContent = 'အီးမေး မာႏ မွေးတဝ်းလဲ့ ငဝ်းပလို့ꩻ ။';
    }
});

adminLogoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        console.log("Admin logged out.");
    } catch (error) {
        console.error("Error logging out admin:", error);
    }
});

auth.onAuthStateChanged(user => {
    if (user && user.uid === ADMIN_UID) {
        adminAuthSection.classList.add('hidden');
        adminAppSection.classList.remove('hidden');
        loadAllUsers();
    } else {
        adminAuthSection.classList.remove('hidden');
        adminAppSection.classList.add('hidden');
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
        adminLoginError.textContent = '';
        userTableBody.innerHTML = '';
        userSearchInput.value = '';
        allUsersData = [];
    }
});

// --- User Management Functions ---
function loadAllUsers() {
    usersRef.on('value', (snapshot) => {
        allUsersData = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const uid = childSnapshot.key;
            allUsersData.push({ uid, ...user });
        });
        displayFilteredUsers();
    }, (error) => {
        console.error("Error loading users:", error);
        adminStatusMessage.textContent = 'အဝ်ႏဒင်ႏထင်ႏ ကေားသွုံꩻဖြာꩻတွင်ꩻ အမာႏအဝ်ႏလွဉ်သွူ။';
        adminStatusMessage.style.display = 'block';
        adminStatusMessage.style.backgroundColor = '#f8d7da';
        adminStatusMessage.style.color = '#721c24';
        adminStatusMessage.style.borderColor = '#f5c6cb';
    });
}

function displayFilteredUsers() {
    userTableBody.innerHTML = '';
    const searchTerm = userSearchInput.value.toLowerCase().trim();

    const filteredUsers = allUsersData.filter(user => {
        if (!searchTerm) {
            return true;
        }
        return (user.email && user.email.toLowerCase().includes(searchTerm)) ||
               (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
               (user.country && user.country.toLowerCase().includes(searchTerm)) ||
               (user.state && user.state.toLowerCase().includes(searchTerm)) ||
               (user.city && user.city.toLowerCase().includes(searchTerm)) ||
               (user.age && user.age.toString().includes(searchTerm)) ||
               (user.uid && user.uid.toLowerCase().includes(searchTerm));
    });

    if (filteredUsers.length === 0 && searchTerm) {
        userTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">ထိုမ်ႏထွား မော့ꩻတဝ်းသွူ။</td></tr>';
    } else if (filteredUsers.length === 0) {
         userTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">ကေားသွုံꩻသားဖုံႏ အဝ်ႏတဝ်းဒွိုန်း။</td></tr>';
    } else {
        filteredUsers.forEach(user => displayUserInTable(user.uid, user));
    }
}


function displayUserInTable(uid, user) {
    const row = userTableBody.insertRow();
    row.insertCell(0).textContent = user.email || 'N/A';
    row.insertCell(1).textContent = user.displayName || 'N/A';
    row.insertCell(2).textContent = user.age || 'N/A';
    row.insertCell(3).textContent = user.gender || 'N/A';
    row.insertCell(4).textContent = user.country || 'N/A';
    row.insertCell(5).textContent = user.state || 'N/A';
    row.insertCell(6).textContent = user.city || 'N/A';
    row.insertCell(7).textContent = user.signupDate || 'N/A';
    row.insertCell(8).textContent = user.status || 'N/A';
    row.insertCell(9).textContent = uid;

    const actionsCell = row.insertCell(10);

    const editButton = document.createElement('button');
    editButton.textContent = 'မွဉ်းဖျင်သွော့ꩻ';
    editButton.addEventListener('click', () => openEditUserModal(uid, user));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'ယားထိုꩻခန်း';
    deleteButton.classList.add('delete-btn');
    deleteButton.addEventListener('click', () => deleteUser(uid, user.email, user.displayName));
    actionsCell.appendChild(deleteButton);
}

userSearchInput.addEventListener('input', () => {
    displayFilteredUsers();
});

// --- Edit User Modal Logic ---
function openEditUserModal(uid, user) {
    editingUserUid = uid;
    editDisplayName.value = user.displayName || '';
    editEmail.value = user.email || '';
    editGender.value = user.gender || '';
    editAge.value = user.age || '';
    editCountry.value = user.country || '';
    editState.value = user.state || '';
    editCity.value = user.city || '';
    editBio.value = user.bio || '';
    editSignupDate.value = user.signupDate || 'N/A';
    editUserError.textContent = '';
    editUserModal.classList.remove('hidden');
}

closeEditModalButton.addEventListener('click', () => {
    editUserModal.classList.add('hidden');
    editingUserUid = null;
});

saveUserChangesButton.addEventListener('click', async () => {
    if (!editingUserUid) return;

    const updatedData = {
        displayName: editDisplayName.value.trim(),
        gender: editGender.value,
        age: editAge.value ? parseInt(editAge.value) : null,
        country: editCountry.value.trim(),
        state: editState.value.trim(),
        city: editCity.value.trim(),
        bio: editBio.value.trim(),
    };

    editUserError.textContent = '';

    try {
        await usersRef.child(editingUserUid).update(updatedData);
        if (auth.currentUser && editingUserUid === auth.currentUser.uid) {
             await auth.currentUser.updateProfile({
                displayName: updatedData.displayName
            });
        }
        showAdminStatusMessage('သိမ်ꩻထူႏ ကေားသွုံꩻသား အချက်အလက်ဖုံႏယို အောင်ႏမျင်ႏလꩻလဲဉ်းသွူ။', false);
        editUserModal.classList.add('hidden');
        editingUserUid = null;
    } catch (error) {
        console.error("Error updating user:", error);
        editUserError.textContent = 'သိမ်ꩻထူႏ ကေားသွုံꩻသား အချက်အလက်တွင်ꩻ အမာႏအဝ်ႏလွဉ်သွူ: ' + error.message;
    }
});

// --- Delete User Function ---
async function deleteUser(uid, email, displayName) {
    if (uid === ADMIN_UID) {
        alert('ယားထိုꩻ ကေားသွုံꩻ ဖန်းဖြယ်အဖြာꩻ တလꩻတဝ်း သွူဩ။');
        return;
    }
    if (confirm(`ကအီႏ ယားကုဲင်ထိုꩻ ${displayName} (${email}) သွုံꩻဖြာꩻ ယိုနဝ်ꩻ စဲင်းစဲ့ဒျာႏမွေးနေ။ ခွိုင်းဝွို့တွမ်ႏ ကေားသွုံꩻသားယို ပသာလိတ်ဖုံႏ ကားကအဝ်ႏနဝ်ꩻလဲ့ အီႏထိုꩻမားလို့သွူ။`)) {
        try {
            await usersRef.child(uid).remove();
            showAdminStatusMessage(`ယားကုဲင်ဒါႏ ${displayName} ကေားသွုံꩻဖြာꩻယို ထွူလဲဉ်းသွူ။`, false);
        } catch (error) {
            console.error("Error deleting user:", error);
            showAdminStatusMessage('ယားကုဲင် ကေားသွုံꩻဖြာꩻယိုတွင်ꩻ အမာႏအဝ်ႏလွဉ်သွူ။: ' + error.message, true);
        }
    }
}

// --- Utility function for Admin Status Messages ---
function showAdminStatusMessage(message, isError) {
    adminStatusMessage.textContent = message;
    adminStatusMessage.style.display = 'block';
    if (isError) {
        adminStatusMessage.style.backgroundColor = '#f8d7da';
        adminStatusMessage.style.color = '#721c24';
        adminStatusMessage.style.borderColor = '#f5c6cb';
    } else {
        adminStatusMessage.style.backgroundColor = '#d4edda';
        adminStatusMessage.style.color = '#155724';
        adminStatusMessage.style.borderColor = '#c3e6cb';
    }
    setTimeout(() => {
        adminStatusMessage.style.display = 'none';
    }, 5000);
}

// Initial state
adminAppSection.classList.add('hidden');
