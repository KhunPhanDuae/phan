// Ensure Firebase is initialized in index.html before this script runs

// DOM elements for Auth
const authSection = document.getElementById('auth-section');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const showSignupButton = document.getElementById('showSignup');
const showLoginButton = document.getElementById('showLogin');

const loginEmailInput = document.getElementById('loginEmailInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('login-error');

const signupEmailInput = document.getElementById('signupEmailInput');
const signupPasswordInput = document.getElementById('signupPasswordInput');
const signupUsernameInput = document.getElementById('signupUsernameInput'); // New
const signupGenderSelect = document.getElementById('signupGenderSelect'); // New
const signupAgeInput = document.getElementById('signupAgeInput'); // New
const signupBornInput = document.getElementById('signupBornInput'); // New
const signupCountryInput = document.getElementById('signupCountryInput'); // New
const signupEthnicityInput = document.getElementById('signupEthnicityInput'); // New
const signupStateInput = document.getElementById('signupStateInput'); // New
const signupCityInput = document.getElementById('signupCityInput'); // New
const signupButton = document.getElementById('signupButton');
const signupError = document.getElementById('signup-error');

// DOM elements for App
const appSection = document.getElementById('app-section');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const logoutButton = document.getElementById('logoutButton');
const profileButton = document.getElementById('profileButton');

const userList = document.getElementById('userList');
const publicChatOption = document.getElementById('publicChatOption');
const friendList = document.getElementById('friendList');
const findFriendInput = document.getElementById('findFriendInput');
const findFriendButton = document.getElementById('findFriendButton');
const findFriendResult = document.getElementById('findFriendResult');
const addFriendButton = document.getElementById('addFriendButton');

const chatPartnerDisplay = document.getElementById('chatPartnerDisplay');
const messagesDiv = document.getElementById('messages');
const chatActions = document.getElementById('chatActions');
const deleteSelectedMessagesButton = document.getElementById('deleteSelectedMessagesButton');
const messageInput = document.getElementById('messageInput');
const imageUploadInput = document.getElementById('imageUploadInput');
const sendButton = document.getElementById('sendButton');

// DOM elements for Profile Modal
const profileModal = document.getElementById('profile-modal');
const profileModalTitle = document.getElementById('profileModalTitle');
const profileIdDisplay = document.getElementById('profileIdDisplay');
const displayNameInput = document.getElementById('displayNameInput');
const bioInput = document.getElementById('bioInput');
const hobbiesInput = document.getElementById('hobbiesInput');
const genderSelect = document.getElementById('genderSelect');
const ageInput = document.getElementById('ageInput'); // New
const bornInput = document.getElementById('bornInput'); // New
const countryInput = document.getElementById('countryInput'); // New
const ethnicityInput = document.getElementById('ethnicityInput'); // New
const stateInput = document.getElementById('stateInput'); // New
const cityInput = document.getElementById('cityInput'); // New

const saveProfileButton = document.getElementById('saveProfileButton');
const closeProfileModal = document.getElementById('closeProfileModal');
const unfriendButton = document.getElementById('unfriendButton');
const profileError = document.getElementById('profile-error');

// DOM elements for Edit Message Modal
const editMessageModal = document.getElementById('edit-message-modal');
const editMessageInput = document.getElementById('editMessageInput');
const saveEditedMessageButton = document.getElementById('saveEditedMessageButton');
const closeEditMessageModal = document.getElementById('closeEditMessageModal');
const editError = document.getElementById('edit-error');

// Global variables
let currentUserId = null;
let currentUserDisplayName = 'Anonymous';
let selectedChatPartnerId = null;
let selectedChatPartnerDisplayName = '';
let currentChatRef = null;
let currentChatType = 'public';
let editingMessageId = null;
let foundFriendUid = null;
let selectedMessagesForDeletion = [];
let currentlyViewedProfileUid = null;

// --- Authentication View Toggles ---
showSignupButton.addEventListener('click', () => {
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
    loginError.textContent = ''; // Clear previous errors
});

showLoginButton.addEventListener('click', () => {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
    signupError.textContent = ''; // Clear previous errors
});

// --- Authentication Handlers ---
signupButton.addEventListener('click', async () => {
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const username = signupUsernameInput.value.trim();
    const gender = signupGenderSelect.value;
    const age = signupAgeInput.value;
    const born = signupBornInput.value;
    const country = signupCountryInput.value.trim();
    const ethnicity = signupEthnicityInput.value.trim();
    const state = signupStateInput.value.trim();
    const city = signupCityInput.value.trim();

    signupError.textContent = '';

    if (!email || !password || !username) {
        signupError.textContent = 'အီးမေး၊ ငဝ်းပလို့ꩻ တွမ်ႏ ကေားသွုံꩻသား အမဉ်ꩻ လꩻတဝ်းဒွိုန်းဩ။'; // Email, password and username are required.
        return;
    }
    if (password.length < 4) {
        signupError.textContent = 'ငဝ်းပလို့ꩻ လိတ်(4)ဖြုံႏ မာꩻကီမꩻလꩻဩ။'; // Password should be at least 6 characters.
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: username
        });
        // Initialize user data in database with detailed default values
        await usersRef.child(userCredential.user.uid).set({
            email: email,
            displayName: username,
            status: 'online',
            bio: '',
            hobbies: '',
            gender: gender,
            age: age ? parseInt(age) : null, // Store as number
            born: born,
            country: country,
            ethnicity: ethnicity,
            state: state,
            city: city
        });
        alert('ဒင်ႏသွင်ꩻမဉ်ꩻ ထွူလဲဉ်း! ယိုခါ နာꩻ နွို့ငါ နွောင်ꩻလဲဉ်းဩ။'); // Sign up successful! You can now log in.
        // Switch to login view after successful signup
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
        loginEmailInput.value = email; // Pre-fill login email
        loginPasswordInput.value = ''; // Clear password
    } catch (error) {
        signupError.textContent = error.message;
    }
});

loginButton.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    loginError.textContent = ''; // Clear previous errors

    // --- Start: Custom Client-Side Validation to hide Firebase errors ---
    if (!email && !password) {
        loginError.textContent = 'ထဲမ်သော့ꩻဖေႏသွော့ꩻ အီးမေးတွမ်ႏ ငဝ်းပလို့ꩻ ဟုဲင်းဩ'; // Please enter email and password.
        return; // Stop execution
    }

    if (!email) {
        loginError.textContent = 'ထဲမ်သော့ꩻဖေႏသွော့ꩻ အီးမေး ဟုဲင်းဩ'; // Please enter your email.
        return;
    }

    if (!password) {
        loginError.textContent = 'ထဲမ်သော့ꩻဖေႏသွော့ꩻ ငဝ်းပလို့ꩻ ဟုဲင်းဩ'; // Please enter your password.
        return;
    }
    // Simple regex for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        loginError.textContent = 'တဲမ်း အီးမေး တမဲဉ်ႏတဝ်းသွူဩ'; // Invalid email format.
        return;
    }
    // --- End: Custom Client-Side Validation ---

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        // Handle Firebase specific errors, but with a generic message for security
        console.error("Firebase Login Error:", error.code, error.message); // Log full error for debugging
        if (error.code === 'auth/invalid-email' ||
            error.code === 'auth/user-disabled' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/wrong-password') {
            
            // Show a generic, less informative message to the user
            loginError.textContent = 'အီးမေး မွေးတဝ်းလဲ့ ငဝ်းပလို့ꩻ တမဲဉ်ႏတဝ်းသွူဩ'; // Invalid email or password.
        } else {
            // For any other unexpected errors, show a general error
            loginError.textContent = 'အဝ်ႏနွို့ငါတွင်ꩻ ထွာလွဉ် အမာႏ။ ဆုဲင်ꩻမꩻ မာꩻချာစံꩻ ယင်းဟုဲင်း။'; // An error occurred during login. Please try again later.
        }
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        if (currentUserId) {
            // Update status to offline before signing out
            await usersRef.child(currentUserId).update({ status: 'offline ' });
        }
        await auth.signOut();
    } catch (error) {
        console.error("Error logging out:", error);
    }
});

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        // Fetch current user's full data including updated display name
        usersRef.child(currentUserId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                currentUserDisplayName = userData.displayName || user.displayName || 'Guest';
                currentUserDisplay.textContent = `နွို့ငါသားမဉ်ꩻ: ${currentUserDisplayName}`;
                usersRef.child(currentUserId).update({
                    status: 'online',
                    displayName: currentUserDisplayName // Ensure displayName is updated from auth if it's new
                });
            } else {
                 // If for some reason user node doesn't exist (e.g., directly logged in from old data), create it with basic data
                usersRef.child(currentUserId).set({
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    status: 'online',
                    bio: '', hobbies: '', gender: '', age: null, born: '',
                    country: '', ethnicity: '', state: '', city: ''
                });
                currentUserDisplayName = user.displayName || user.email.split('@')[0];
                currentUserDisplay.textContent = `နွို့ငါသားမဉ်ꩻ: ${currentUserDisplayName}`;
            }
        });
        
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');

        loadFriends(); // Load friends list
        loadAllUsersForFriendSearch(); // Load all users for finding friends
        selectPublicChat(); // Auto-select public chat on login

    } else {
        // Reset all global variables and UI when logged out
        currentUserId = null;
        currentUserDisplayName = 'Anonymous';
        selectedChatPartnerId = null;
        selectedChatPartnerDisplayName = '';
        currentChatRef = null;
        currentChatType = 'public';
        editingMessageId = null;
        foundFriendUid = null;
        selectedMessagesForDeletion = [];
        currentlyViewedProfileUid = null;

        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');

        // Clear UI elements
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
        signupUsernameInput.value = '';
        signupGenderSelect.value = '';
        signupAgeInput.value = '';
        signupBornInput.value = '';
        signupCountryInput.value = '';
        signupEthnicityInput.value = '';
        signupStateInput.value = '';
        signupCityInput.value = '';
        loginError.textContent = '';
        signupError.textContent = '';

        friendList.innerHTML = '';
        userList.querySelector('#publicChatOption').classList.remove('လွိုက်လဲဉ်း');
        chatPartnerDisplay.textContent = 'လွိုက် ဒေါ့ꩻရီ';
        messagesDiv.innerHTML = '';
        messageInput.value = '';
        sendButton.disabled = true;
        findFriendInput.value = '';
        findFriendResult.textContent = '';
        addFriendButton.classList.add('hidden');
        chatActions.classList.add('hidden');
        deleteSelectedMessagesButton.classList.add('hidden');
        unfriendButton.classList.add('hidden');

        // Ensure login view is shown on logout
        loginView.classList.remove('hidden');
        signupView.classList.add('hidden');
    }
});

// --- Profile Management ---
profileButton.addEventListener('click', () => {
    // When "My Profile" is clicked, it's always editable
    profileModalTitle.textContent = 'ခွေ နမ်းအအဲဉ်ႏ';
    setProfileFieldsEditable(true); // Make fields editable
    saveProfileButton.classList.remove('hidden'); // Ensure save button is visible for own profile
    unfriendButton.classList.add('hidden'); // Hide unfriend button for own profile
    profileModal.classList.remove('hidden');
    loadUserProfile(currentUserId);
    currentlyViewedProfileUid = currentUserId; // Set to current user's UID
});

closeProfileModal.addEventListener('click', () => {
    profileModal.classList.add('hidden');
    currentlyViewedProfileUid = null; // Clear viewed profile UID on close
});

// Helper function to set modal fields to read-only/editable
function setProfileFieldsEditable(editable) {
    profileIdDisplay.readOnly = true; // User ID is always read-only
    displayNameInput.readOnly = !editable;
    bioInput.readOnly = !editable;
    hobbiesInput.readOnly = !editable;
    genderSelect.disabled = !editable;
    ageInput.readOnly = !editable; // New
    bornInput.readOnly = !editable; // New
    countryInput.readOnly = !editable; // New
    ethnicityInput.readOnly = !editable; // New
    stateInput.readOnly = !editable; // New
    cityInput.readOnly = !editable; // New
    // saveProfileButton.classList.toggle('hidden', !editable); // Managed by direct calls now
}

// Function to load and display profile data
async function loadUserProfile(uid) {
    try {
        const snapshot = await usersRef.child(uid).once('value');
        if (snapshot.exists()) {
            const userData = snapshot.val();
            profileIdDisplay.value = uid;
            displayNameInput.value = userData.displayName || '';
            bioInput.value = userData.bio || '';
            hobbiesInput.value = userData.hobbies || '';
            genderSelect.value = userData.gender || '';
            ageInput.value = userData.age || ''; // New
            bornInput.value = userData.born || ''; // New
            countryInput.value = userData.country || ''; // New
            ethnicityInput.value = userData.ethnicity || ''; // New
            stateInput.value = userData.state || ''; // New
            cityInput.value = userData.city || ''; // New
            profileError.textContent = '';
        } else {
            profileError.textContent = "မော့ꩻတဝ်း နမ်းအအဲဉ်ႏ လိတ်လာႏ.";
        }
    } catch (error) {
        profileError.textContent = "Error loading profile: " + error.message;
        console.error("Error loading profile:", error);
    }
}

saveProfileButton.addEventListener('click', async () => {
    const newDisplayName = displayNameInput.value.trim();
    const newBio = bioInput.value.trim();
    const newHobbies = hobbiesInput.value.trim();
    const newGender = genderSelect.value;
    const newAge = ageInput.value; // New
    const newBorn = bornInput.value; // New
    const newCountry = countryInput.value.trim(); // New
    const newEthnicity = ethnicityInput.value.trim(); // New
    const newState = stateInput.value.trim(); // New
    const newCity = cityInput.value.trim(); // New

    profileError.textContent = '';

    if (newDisplayName && currentUserId) {
        try {
            // Update Auth display name
            await auth.currentUser.updateProfile({
                displayName: newDisplayName
            });
            // Update user data in Realtime Database
            await usersRef.child(currentUserId).update({
                displayName: newDisplayName,
                bio: newBio,
                hobbies: newHobbies,
                gender: newGender,
                age: newAge ? parseInt(newAge) : null, // Ensure age is stored as number
                born: newBorn,
                country: newCountry,
                ethnicity: newEthnicity,
                state: newState,
                city: newCity
            });
            currentUserDisplayName = newDisplayName;
            currentUserDisplay.textContent = `နွို့ငါသားမဉ်ꩻ: ${currentUserDisplayName}`;
            profileModal.classList.add('hidden');
            loadFriends(); // Reload friends to update display names if needed
        } catch (error) {
            profileError.textContent = "ဒင်ႏသွင်ꩻ နမ်းအအဲဉ်ႏတွင်ꩻ အမာႏအဝ်ႏ: " + error.message;
        }
    } else {
        profileError.textContent = "ဒင်ႏသွင်ꩻအမဉ်ꩻသား အဝ်ႏထွူလဲဉ်းသွူဩ။";
    }
});


// --- Friends Management ---
let allUsersData = {}; // Cache all users for friend search

function loadAllUsersForFriendSearch() {
    usersRef.on('value', (snapshot) => {
        allUsersData = {};
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const uid = childSnapshot.key;
            allUsersData[uid] = user;
        });
    });
}

findFriendButton.addEventListener('click', async () => {
    const searchTerm = findFriendInput.value.trim().toLowerCase();
    findFriendResult.textContent = '';
    addFriendButton.classList.add('hidden');
    foundFriendUid = null;

    if (searchTerm === '') {
        findFriendResult.textContent = 'Please enter an email, display name, or user ID to search.';
        return;
    }

    if (currentUserId) {
        let foundUser = null;
        for (const uid in allUsersData) {
            const user = allUsersData[uid];
            // Skip current user and already friends
            if (uid === currentUserId || (allUsersData[currentUserId].friends && allUsersData[currentUserId].friends[uid])) {
                continue;
            }
            // Search by Email, Display Name, or UID
            if (user.email.toLowerCase() === searchTerm ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
                uid.toLowerCase() === searchTerm // Search by UID
            ) {
                foundUser = { uid, ...user };
                break;
            }
        }

        if (foundUser) {
            foundFriendUid = foundUser.uid;
            findFriendResult.textContent = `ထီႏမော့ꩻ: ${foundUser.displayName} (${foundUser.email})`;
            addFriendButton.classList.remove('hidden');
        } else {
            findFriendResult.textContent = 'No user found or user is already your friend.';
        }
    }
});

addFriendButton.addEventListener('click', async () => {
    if (foundFriendUid && currentUserId) {
        try {
            await usersRef.child(currentUserId).child('friends').child(foundFriendUid).set(true);
            await usersRef.child(foundFriendUid).child('friends').child(currentUserId).set(true);
            
            findFriendResult.textContent = `နာꩻမာꩻသွꩻလဲဉ်း ${allUsersData[foundFriendUid].displayName} သွူဩ။`;
            addFriendButton.classList.add('hidden');
            foundFriendUid = null;
            findFriendInput.value = '';
            loadFriends();
        } catch (error) {
            findFriendResult.textContent = "အဝ်ႏပေါင်ꩻသွꩻတွင်ꩻ ထွာအမာႏ: " + error.message;
        }
    }
});

function loadFriends() {
    friendList.innerHTML = '';

    if (!currentUserId) return;

    usersRef.child(currentUserId).child('friends').on('value', async (snapshot) => {
        friendList.innerHTML = '';
        if (snapshot.exists()) {
            const friendUids = snapshot.val();
            const friendPromises = [];
            for (const friendUid in friendUids) {
                friendPromises.push(
                    usersRef.child(friendUid).once('value').then(friendSnap => {
                        if (friendSnap.exists()) {
                            const friend = friendSnap.val();
                            const listItem = document.createElement('li');
                            listItem.classList.add('user-list-item');
                            listItem.dataset.uid = friendUid;
                            listItem.dataset.displayName = friend.displayName || 'Unknown User';
                            listItem.dataset.chatType = 'private';

                            const friendNameSpan = document.createElement('span');
                            friendNameSpan.textContent = `${friend.displayName || 'Unknown User'} (${friend.status || 'offline '})`;
                            friendNameSpan.style.flexGrow = '1';

                            const viewProfileButton = document.createElement('button');
                            viewProfileButton.classList.add('profile-link');
                            viewProfileButton.textContent = 'ထွား နမ်းအအဲဉ်ႏ';
                            viewProfileButton.addEventListener('click', (e) => {
                                e.stopPropagation(); // Prevent opening chat when viewing profile
                                profileModalTitle.textContent = `${friend.displayName || 'User'}'တဖြာꩻ နမ်းအအဲဉ်ႏ`;
                                setProfileFieldsEditable(false); // Make fields read-only
                                saveProfileButton.classList.add('hidden'); // Hide save button for friend's profile
                                unfriendButton.classList.remove('hidden'); // Show unfriend button
                                unfriendButton.dataset.friendUid = friendUid; // Store the friend's UID
                                profileModal.classList.remove('hidden');
                                loadUserProfile(friendUid);
                                currentlyViewedProfileUid = friendUid; // Set to friend's UID
                            });

                            listItem.appendChild(friendNameSpan);
                            listItem.appendChild(viewProfileButton);
                            
                            listItem.addEventListener('click', (event) => {
                                // Only allow clicking if the event target is not the profile button
                                if (event.target !== viewProfileButton) {
                                    selectChatPartner(friendUid, friend.displayName || 'Unknown User');
                                }
                            });
                            friendList.appendChild(listItem);
                        }
                    })
                );
            }
            await Promise.all(friendPromises);
        }
    });
}

// New: Unfriend button click handler
unfriendButton.addEventListener('click', async () => {
    const friendUidToUnfriend = unfriendButton.dataset.friendUid;
    if (friendUidToUnfriend && currentUserId && confirm(`နာꩻမဉ်ꩻထွာသွꩻတဝ်းဒွုမ် ${allUsersData[friendUidToUnfriend].displayName}နဝ်ꩻ စဲင်းစဲ့ဒျာႏနဲ့? `)) {
        try {
            // Remove from current user's friends list
            await usersRef.child(currentUserId).child('friends').child(friendUidToUnfriend).remove();
            // Remove current user from friend's friends list
            await usersRef.child(friendUidToUnfriend).child('friends').child(currentUserId).remove();
            
            alert(`မာꩻသွꩻတဝ်းဒွုမ် ${allUsersData[friendUidToUnfriend].displayName} နဝ်ꩻသွူဩ`);
            profileModal.classList.add('hidden'); // Close modal after unfriending
            currentlyViewedProfileUid = null;
            loadFriends(); // Reload friends list to reflect changes
            
            // If the unfriended user was the currently selected chat partner, switch to public chat
            if (selectedChatPartnerId === friendUidToUnfriend) {
                selectPublicChat();
            }

        } catch (error) {
            profileError.textContent = "Error unfriending: " + error.message;
            console.error("Error unfriending:", error);
        }
    }
});


// --- Chat Switching and Message Sending ---
publicChatOption.addEventListener('click', () => {
    selectPublicChat();
});

function selectChat(chatType, id = null, displayName = '') {
    // Remove 'selected' class from all list items
    document.querySelectorAll('.user-list-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add 'selected' class to the newly selected item
    if (chatType === 'public') {
        publicChatOption.classList.add('selected');
    } else if (id) {
        const selectedPrivateChat = document.querySelector(`.user-list-item[data-uid="${id}"]`);
        if (selectedPrivateChat) {
            selectedPrivateChat.classList.add('selected');
        }
    }

    // Detach previous listeners if any
    if (currentChatRef) {
        currentChatRef.off('child_added');
        currentChatRef.off('child_changed');
        currentChatRef.off('child_removed');
    }

    messagesDiv.innerHTML = ''; // Clear previous chat messages
    messageInput.value = '';
    sendButton.disabled = false; // Enable send button when a chat is selected
    imageUploadInput.disabled = false; // Enable image upload for all chats initially

    currentChatType = chatType;
    selectedMessagesForDeletion = []; // Clear selected messages when changing chat
    updateDeleteButtonVisibility(); // Update button visibility

    if (chatType === 'public') {
        selectedChatPartnerId = null;
        selectedChatPartnerDisplayName = '';
        chatPartnerDisplay.textContent = 'အုံမွန်းဒေါ့ꩻရီတွမ်ႏ လိုꩻအာ';
        currentChatRef = publicChatRef;
        chatActions.classList.remove('hidden'); // Show chat actions for public chat
    } else { // Private chat
        // Only allow private chat if the selected user is a friend
        if (!allUsersData[currentUserId] || !allUsersData[currentUserId].friends || !allUsersData[currentUserId].friends[id]) {
            chatPartnerDisplay.textContent = 'Not friends. Add them to chat.';
            sendButton.disabled = true;
            imageUploadInput.disabled = true;
            messagesDiv.innerHTML = '<p style="text-align: center; color: #888;">You can only chat with your friends. Add them first!</p>';
            currentChatRef = null; // No chat ref if not friends
            chatActions.classList.add('hidden'); // Hide chat actions if not friends
            return;
        }

        selectedChatPartnerId = id;
        selectedChatPartnerDisplayName = displayName;
        chatPartnerDisplay.textContent = `အဝ်ႏဒေါ့ꩻရီတွမ်ႏ: ${selectedChatPartnerDisplayName}`;
        imageUploadInput.disabled = false;
        chatActions.classList.remove('hidden'); // Show chat actions for private chat

        const chatIds = [currentUserId, selectedChatPartnerId].sort();
        const chatId = chatIds[0] + '_' + chatIds[1];
        chatsRef.child(chatId).child('participants').set({
            user1: chatIds[0],
            user2: chatIds[1]
        });
        currentChatRef = chatsRef.child(chatId).child('messages');
    }

    // Listen for new messages in the currently selected chat
    if (currentChatRef) { // Only attach listeners if currentChatRef is valid
        currentChatRef.on('child_added', (snapshot) => {
            const message = { id: snapshot.key, ...snapshot.val() };
            displayMessage(message);
        });

        // Listen for message changes (edits)
        currentChatRef.on('child_changed', (snapshot) => {
            const updatedMessage = { id: snapshot.key, ...snapshot.val() };
            updateMessageInView(updatedMessage);
        });

        // Listen for message removals (deletes)
        currentChatRef.on('child_removed', (snapshot) => {
            removeMessageFromView(snapshot.key);
        });
    }
}

function selectPublicChat() {
    selectChat('public');
}

function selectChatPartner(uid, displayName) {
    selectChat('private', uid, displayName);
}

sendButton.addEventListener('click', async () => {
    const messageText = messageInput.value.trim();
    const imageFile = imageUploadInput.files[0];

    if (!currentChatRef || !currentUserId) return;

    if (messageText === '' && !imageFile) {
        alert('Please enter a message or select an image to send.');
        return;
    }

    sendButton.disabled = true;
    let imageUrl = null;
    let imageName = null;

    if (imageFile) {
        try {
            const timestamp = new Date().getTime();
            imageName = `${currentUserId}_${timestamp}_${imageFile.name}`;
            const imageRef = storageRef.child(`chat_images/${imageName}`);
            const snapshot = await imageRef.put(imageFile);
            imageUrl = await snapshot.ref.getDownloadURL();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image: " + error.message);
            sendButton.disabled = false;
            return;
        }
    }

    try {
        await currentChatRef.push({
            senderId: currentUserId,
            senderName: currentUserDisplayName,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            edited: false,
            imageUrl: imageUrl || null,
            imageName: imageName || null
        });
        messageInput.value = '';
        imageUploadInput.value = '';
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    } finally {
        sendButton.disabled = false;
    }
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.dataset.messageId = message.id;

    if (message.senderId === currentUserId) {
        messageElement.classList.add('sent');
        // Add click listener for selection only for sent messages
        messageElement.addEventListener('click', () => toggleMessageSelection(message.id, messageElement));
    }

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = message.senderName + ': ';

    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.textContent = message.text;

    if (message.imageUrl) {
        const imageElement = document.createElement('img');
        imageElement.src = message.imageUrl;
        imageElement.alt = message.imageName || 'chat image';
        imageElement.classList.add('message-image');
        messageElement.appendChild(imageElement);
    }

    if (message.edited) {
        const editedIndicator = document.createElement('span');
        editedIndicator.textContent = ' (edited)';
        editedIndicator.style.fontSize = '0.7em';
        editedIndicator.style.color = '#888';
        textSpan.appendChild(editedIndicator);
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    if (message.timestamp) {
        const date = new Date(message.timestamp);
        // Format time with AM/PM
        timestampSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('actions');

    if (message.senderId === currentUserId) {
        const editButton = document.createElement('button');
        editButton.textContent = 'မွဉ်းဖျင်';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent message selection when clicking edit
            if (message.imageUrl) {
                alert('Cannot edit image messages directly.');
                return;
            }
            openEditMessageModal(message.id, message.text);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'ယားကုဲင်';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent message selection when clicking delete
            deleteMessage(message.id, message.imageName);
        });

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
    }

    messageElement.appendChild(senderSpan);
    if (message.text) {
        messageElement.appendChild(textSpan);
    }
    
    messageElement.appendChild(timestampSpan);
    messageElement.appendChild(actionsDiv);

    messagesDiv.appendChild(messageElement);

    if (message.imageUrl) {
        const img = messageElement.querySelector('.message-image');
        if (img) {
            img.onload = () => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            };
        }
    } else {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function updateMessageInView(updatedMessage) {
    const messageElement = messagesDiv.querySelector(`[data-message-id="${updatedMessage.id}"]`);
    if (messageElement) {
        const textSpan = messageElement.querySelector('.message-text');
        if (textSpan) {
            textSpan.innerHTML = '';
            textSpan.textContent = updatedMessage.text;

            if (updatedMessage.edited) {
                const editedIndicator = document.createElement('span');
                editedIndicator.textContent = ' (edited)';
                editedIndicator.style.fontSize = '0.7em';
                editedIndicator.style.color = '#888';
                textSpan.appendChild(editedIndicator);
            }
        }
    }
}

async function removeMessageFromView(messageId) {
    const messageElement = messagesDiv.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
        // Remove from selectedMessagesForDeletion if it was selected
        selectedMessagesForDeletion = selectedMessagesForDeletion.filter(id => id !== messageId);
        updateDeleteButtonVisibility();
    }
}

// --- Message Selection and Bulk Deletion ---
function toggleMessageSelection(messageId, messageElement) {
    const index = selectedMessagesForDeletion.indexOf(messageId);
    if (index > -1) {
        // Message is already selected, deselect it
        selectedMessagesForDeletion.splice(index, 1);
        messageElement.classList.remove('selected-for-delete');
    } else {
        // Message is not selected, select it
        selectedMessagesForDeletion.push(messageId);
        messageElement.classList.add('selected-for-delete');
    }
    updateDeleteButtonVisibility();
}

function updateDeleteButtonVisibility() {
    if (selectedMessagesForDeletion.length > 0) {
        deleteSelectedMessagesButton.classList.remove('hidden');
    } else {
        deleteSelectedMessagesButton.classList.add('hidden');
    }
}

deleteSelectedMessagesButton.addEventListener('click', async () => {
    if (selectedMessagesForDeletion.length === 0) {
        alert('No messages selected for deletion.');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedMessagesForDeletion.length} selected messages?`)) {
        try {
            const deletePromises = selectedMessagesForDeletion.map(async (messageId) => {
                const messageRef = currentChatRef.child(messageId);
                const snapshot = await messageRef.once('value');
                const messageData = snapshot.val();

                if (messageData && messageData.senderId === currentUserId) { // Only allow sender to delete their own messages
                    await messageRef.remove();
                    if (messageData.imageName) {
                        const imageRef = storageRef.child(`chat_images/${messageData.imageName}`);
                        await imageRef.delete();
                        console.log("Image deleted from Storage:", messageData.imageName);
                    }
                } else {
                    console.warn(`Attempted to delete message ${messageId} not owned by current user or message not found.`);
                }
            });
            await Promise.all(deletePromises);
            selectedMessagesForDeletion = []; // Clear selection after deletion
            updateDeleteButtonVisibility();
        } catch (error) {
            console.error("Error deleting selected messages:", error);
            alert("Failed to delete selected messages: " + error.message);
        }
    }
});


// --- Edit Message Modal Logic ---
function openEditMessageModal(messageId, currentText) {
    editingMessageId = messageId;
    editMessageInput.value = currentText;
    editError.textContent = '';
    editMessageModal.classList.remove('hidden');
}

closeEditMessageModal.addEventListener('click', () => {
    editMessageModal.classList.add('hidden');
    editingMessageId = null;
});

saveEditedMessageButton.addEventListener('click', async () => {
    const newText = editMessageInput.value.trim();
    editError.textContent = '';

    if (newText && editingMessageId && currentChatRef) {
        try {
            await currentChatRef.child(editingMessageId).update({
                text: newText,
                edited: true
            });
            editMessageModal.classList.add('hidden');
            editingMessageId = null;
        } catch (error) {
            editError.textContent = "Error saving changes: " + error.message;
        }
    } else {
        editError.textContent = "Message cannot be empty.";
    }
});

// --- Single Message Delete Logic (Still available from actions menu) ---
async function deleteMessage(messageId, imageName) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            if (currentChatRef && messageId) {
                // Remove from Firebase Realtime Database
                await currentChatRef.child(messageId).remove();
                
                // If it was an image message, delete from Storage
                if (imageName) {
                    const imageRef = storageRef.child(`chat_images/${imageName}`);
                    await imageRef.delete();
                    console.log("Image deleted from Storage:", imageName);
                }
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message: " + error.message);
        }
    }
}

// Initial state: Ensure app section is hidden and login view is shown on page load
appSection.classList.add('hidden');
loginView.classList.remove('hidden');
signupView.classList.add('hidden');
