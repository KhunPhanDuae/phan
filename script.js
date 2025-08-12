// Global variables to be used across all pages
let currentUserId = null;
let currentUserDisplayName = 'Anonymous';
let selectedChatPartnerId = null;
let selectedChatPartnerDisplayName = '';
let currentChatRef = null;
let currentChatType = 'public';
let foundFriendUid = null;
let allUsersData = {};
let currentlyViewedProfileUid = null;
let selectedMessages = new Set();
let messageElements = new Map();

// DOM elements for Auth (index.html)
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const showSignupButton = document.getElementById('showSignup');
const showLoginButton = document.getElementById('showLogin');
const loginEmailInput = document.getElementById('loginEmailInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('login-error');
const signupButton = document.getElementById('signupButton');
const signupError = document.getElementById('signup-error');
const signupDateInput = document.getElementById('signupDateInput');
const signupEmailInput = document.getElementById('signupEmailInput');
const signupPasswordInput = document.getElementById('signupPasswordInput');
const signupUsernameInput = document.getElementById('signupUsernameInput');
const signupGenderSelect = document.getElementById('signupGenderSelect');
const signupAgeInput = document.getElementById('signupAgeInput');
const signupBornInput = document.getElementById('signupBornInput');
const signupCountryInput = document.getElementById('signupCountryInput');
const signupEthnicityInput = document.getElementById('signupEthnicityInput');
const signupStateInput = document.getElementById('signupStateInput');
const signupCityInput = document.getElementById('signupCityInput');

// DOM elements for Main Page (main.html)
const currentUserDisplay = document.getElementById('currentUserDisplay');
const mainProfileButton = document.getElementById('mainProfileButton');
const logoutButton = document.getElementById('logoutButton');
const addFriendButton = document.getElementById('addFriendButton');
const mainChatList = document.getElementById('mainChatList');
const publicChatOption = document.getElementById('publicChatOption');
const friendList = document.getElementById('friendList');
const findFriendInput = document.getElementById('findFriendInput');
const findFriendSearchButton = document.getElementById('findFriendSearchButton');
const findFriendResult = document.getElementById('findFriendResult');
const addFriendAction = document.getElementById('addFriendAction');

// DOM elements for Chat Page (chat.html)
const backToMainButton = document.getElementById('backToMainButton');
const chatPartnerDisplay = document.getElementById('chatPartnerDisplay');
const viewPartnerProfileButton = document.getElementById('viewPartnerProfileButton');
const viewGroupMembersButton = document.getElementById('viewGroupMembersButton');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// DOM elements for Profile Modal (used on main.html and chat.html)
const profileModal = document.getElementById('profile-modal');
const profileModalTitle = document.getElementById('profileModalTitle');
const profileIdDisplay = document.getElementById('profileIdDisplay');
const displayNameInput = document.getElementById('displayNameInput');
const bioInput = document.getElementById('bioInput');
const hobbiesInput = document.getElementById('hobbiesInput');
const genderSelect = document.getElementById('genderSelect');
const ageInput = document.getElementById('ageInput');
const bornInput = document.getElementById('bornInput');
const countryInput = document.getElementById('countryInput');
const ethnicityInput = document.getElementById('ethnicityInput');
const stateInput = document.getElementById('stateInput');
const cityInput = document.getElementById('cityInput');
const signupDateDisplay = document.getElementById('signupDateDisplay');
const saveProfileButton = document.getElementById('saveProfileButton');
const closeProfileModal = document.getElementById('closeProfileModal');
const unfriendButton = document.getElementById('unfriendButton');
const profileError = document.getElementById('profile-error');

// DOM elements for Group Members Modal (chat.html)
const groupMembersModal = document.getElementById('group-members-modal');
const groupMembersList = document.getElementById('group-members-list');
const closeGroupMembersModal = document.getElementById('closeGroupMembersModal');

// DOM elements for Message Actions Modal (chat.html)
const messageActionsModal = document.getElementById('message-actions-modal');
const editMessageInput = document.getElementById('editMessageInput');
const editButton = document.getElementById('editButton');
const deleteButton = document.getElementById('deleteButton');
const cancelButton = document.getElementById('cancelButton');
let messageToEditKey = null;

// --- Global Functions ---
function setProfileFieldsEditable(editable) {
    if (profileIdDisplay) profileIdDisplay.readOnly = true;
    if (displayNameInput) displayNameInput.readOnly = !editable;
    if (bioInput) bioInput.readOnly = !editable;
    if (hobbiesInput) hobbiesInput.readOnly = !editable;
    if (genderSelect) genderSelect.disabled = !editable;
    if (ageInput) ageInput.readOnly = !editable;
    if (bornInput) bornInput.readOnly = !editable;
    if (countryInput) countryInput.readOnly = !editable;
    if (ethnicityInput) ethnicityInput.readOnly = !editable;
    if (stateInput) stateInput.readOnly = !editable;
    if (cityInput) cityInput.readOnly = !editable;
    if (signupDateDisplay) signupDateDisplay.readOnly = true;
    if (saveProfileButton) {
        if (editable) saveProfileButton.classList.remove('hidden');
        else saveProfileButton.classList.add('hidden');
    }
    if (unfriendButton) {
        unfriendButton.classList.add('hidden');
    }
}

async function loadUserProfile(uid) {
    try {
        const snapshot = await usersRef.child(uid).once('value');
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (profileIdDisplay) profileIdDisplay.value = uid;
            if (displayNameInput) displayNameInput.value = userData.displayName || '';
            if (bioInput) bioInput.value = userData.bio || '';
            if (hobbiesInput) hobbiesInput.value = userData.hobbies || '';
            if (genderSelect) genderSelect.value = userData.gender || '';
            if (ageInput) ageInput.value = userData.age || '';
            if (bornInput) bornInput.value = userData.born || '';
            if (countryInput) countryInput.value = userData.country || '';
            if (ethnicityInput) ethnicityInput.value = userData.ethnicity || '';
            if (stateInput) stateInput.value = userData.state || '';
            if (cityInput) cityInput.value = userData.city || '';
            if (signupDateDisplay) signupDateDisplay.value = userData.signupDate || 'N/A';
            if (profileError) profileError.textContent = '';
        } else {
            if (profileError) profileError.textContent = "မော့ꩻတဝ်း နမ်းအအဲဉ်ႏ လိတ်လာႏ.";
        }
    } catch (error) {
        if (profileError) profileError.textContent = "Error loading profile: " + error.message;
        console.error("Error loading profile:", error);
    }
}

// --- Authentication & Redirection Logic ---
auth.onAuthStateChanged(user => {
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const isMainPage = window.location.pathname.endsWith('main.html');
    const isChatPage = window.location.pathname.endsWith('chat.html');

    if (user) {
        currentUserId = user.uid;

        if (isLoginPage) {
            window.location.href = 'main.html';
        }
        
        if (isMainPage) {
            loadAllUsersForFriendSearch();
            loadFriendsList();
            setupMainPageListeners();
        }
        
        if (isChatPage) {
            loadAllUsersForFriendSearch();
            setupChatPageListeners();
        }

    } else {
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
        currentUserId = null;
    }
});

// --- index.html specific logic ---
if (showSignupButton) {
    showSignupButton.addEventListener('click', () => {
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
        loginError.textContent = '';
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        if (signupDateInput) signupDateInput.value = `${yyyy}-${mm}-${dd}`;
    });
}

if (showLoginButton) {
    showLoginButton.addEventListener('click', () => {
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
        signupError.textContent = '';
    });
}

if (signupButton) {
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
        const signupDate = signupDateInput.value;

        signupError.textContent = '';

        if (!email || !password || !username) {
            signupError.textContent = 'အီးမေး၊ ငဝ်းပလို့ꩻ တွမ်ႏ ကေားသွုံꩻသား အမဉ်ꩻ လꩻတဝ်းဒွိုန်းဩ။';
            return;
        }
        if (password.length < 4) {
            signupError.textContent = 'ငဝ်းပလို့ꩻ လိတ်(4)ဖြုံႏ မာꩻကီမꩻလꩻဩ။';
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({
                displayName: username
            });
            await usersRef.child(userCredential.user.uid).set({
                email: email,
                displayName: username,
                status: 'online',
                bio: '',
                hobbies: '',
                gender: gender,
                age: age ? parseInt(age) : null,
                born: born,
                country: country,
                ethnicity: ethnicity,
                state: state,
                city: city,
                signupDate: signupDate
            });
            alert('ဒင်ႏသွင်ꩻမဉ်ꩻ ထွူလဲဉ်း! ယိုခါ နာꩻ နွို့ငါ နွောင်ꩻလဲဉ်းဩ။');
            loginEmailInput.value = email;
            loginPasswordInput.value = '';
            loginView.classList.remove('hidden');
            signupView.classList.add('hidden');
        } catch (error) {
            signupError.textContent = error.message;
        }
    });
}

if (loginButton) {
    loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();
        loginError.textContent = '';

        if (!email || !password) {
            loginError.textContent = 'တဲမ်းဖေႏသွော့ꩻ အီးမေးတွမ်ႏငဝ်းပလို့ꩻ';
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            loginError.textContent = error.message;
        }
    });
}

// --- main.html specific logic ---
function setupMainPageListeners() {
    if (mainProfileButton) {
        mainProfileButton.addEventListener('click', () => {
            profileModalTitle.textContent = 'ခွေ နမ်းအအဲဉ်ႏ';
            setProfileFieldsEditable(true);
            loadUserProfile(currentUserId);
            profileModal.classList.remove('hidden');
            unfriendButton.classList.add('hidden');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await auth.signOut();
        });
    }

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            profileModal.classList.add('hidden');
        });
    }

    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', async () => {
            const newDisplayName = displayNameInput.value.trim();
            const newBio = bioInput.value.trim();
            const newHobbies = hobbiesInput.value.trim();
            const newGender = genderSelect.value;
            const newAge = ageInput.value;
            const newBorn = bornInput.value;
            const newCountry = countryInput.value.trim();
            const newEthnicity = ethnicityInput.value.trim();
            const newState = stateInput.value.trim();
            const newCity = cityInput.value.trim();

            if (!newDisplayName) {
                profileError.textContent = 'Display name cannot be empty.';
                return;
            }

            try {
                await usersRef.child(currentUserId).update({
                    displayName: newDisplayName,
                    bio: newBio,
                    hobbies: newHobbies,
                    gender: newGender,
                    age: newAge ? parseInt(newAge) : null,
                    born: newBorn,
                    country: newCountry,
                    ethnicity: newEthnicity,
                    state: newState,
                    city: newCity
                });
                if (auth.currentUser) {
                    await auth.currentUser.updateProfile({ displayName: newDisplayName });
                }
                alert('Profile updated successfully!');
                profileModal.classList.add('hidden');
            } catch (error) {
                profileError.textContent = "Error updating profile: " + error.message;
            }
        });
    }

    if (publicChatOption) {
        publicChatOption.addEventListener('click', () => {
            window.location.href = `chat.html?chatType=public`;
        });
    }

    if (friendList) {
        friendList.addEventListener('click', (event) => {
            const listItem = event.target.closest('.main-list-item');
            if (listItem && listItem.dataset.uid) {
                const friendUid = listItem.dataset.uid;
                const friendName = listItem.querySelector('.list-item-name').textContent;
                window.location.href = `chat.html?chatType=private&uid=${friendUid}&name=${encodeURIComponent(friendName)}`;
            }
        });
    }

    if (findFriendSearchButton) {
        findFriendSearchButton.addEventListener('click', async () => {
            const searchTerm = findFriendInput.value.trim().toLowerCase();
            findFriendResult.textContent = '';
            addFriendAction.classList.add('hidden');
            foundFriendUid = null;

            if (searchTerm === '') {
                findFriendResult.textContent = 'Please enter an email or display name to search.';
                return;
            }

            let foundUser = null;
            for (const uid in allUsersData) {
                const user = allUsersData[uid];
                if (uid === currentUserId || (allUsersData[currentUserId].friends && allUsersData[currentUserId].friends[uid])) {
                    continue;
                }
                if (user.email.toLowerCase() === searchTerm || (user.displayName && user.displayName.toLowerCase().includes(searchTerm))) {
                    foundUser = { uid, ...user };
                    break;
                }
            }
            if (foundUser) {
                foundFriendUid = foundUser.uid;
                findFriendResult.textContent = `Found: ${foundUser.displayName} (${foundUser.email})`;
                addFriendAction.classList.remove('hidden');
            } else {
                findFriendResult.textContent = 'No user found or user is already your friend.';
            }
        });
    }

    if (addFriendAction) {
        addFriendAction.addEventListener('click', async () => {
            if (foundFriendUid && currentUserId) {
                try {
                    await usersRef.child(currentUserId).child('friends').child(foundFriendUid).set(true);
                    await usersRef.child(foundFriendUid).child('friends').child(currentUserId).set(true);
                    
                    findFriendResult.textContent = `Friend added!`;
                    addFriendAction.classList.add('hidden');
                    foundFriendUid = null;
                    findFriendInput.value = '';
                    loadFriendsList();
                } catch (error) {
                    findFriendResult.textContent = "Error adding friend: " + error.message;
                }
            }
        });
    }
}

function loadAllUsersForFriendSearch() {
    if (!usersRef) return;
    usersRef.on('value', (snapshot) => {
        allUsersData = {};
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const uid = childSnapshot.key;
            allUsersData[uid] = user;
        });
        if (currentUserDisplay && auth.currentUser) {
            currentUserDisplay.textContent = auth.currentUser.displayName || 'လွိုက် ဒေါ့ꩻရီ';
        }
    });
}

function loadFriendsList() {
    if (!friendList || !currentUserId || !usersRef) return;
    friendList.innerHTML = '';

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
                            listItem.classList.add('main-list-item');
                            listItem.dataset.uid = friendUid;

                            const nameSpan = document.createElement('span');
                            nameSpan.classList.add('list-item-name');
                            nameSpan.textContent = friend.displayName || 'Unknown User';
                            listItem.appendChild(nameSpan);
                            
                            const statusIndicator = document.createElement('span');
                            statusIndicator.classList.add('status-indicator');
                            if (friend.status === 'online') {
                                statusIndicator.classList.add('online');
                            }
                            listItem.appendChild(statusIndicator);
                            
                            friendList.appendChild(listItem);
                        }
                    })
                );
            }
            await Promise.all(friendPromises);
        }
    });
}

// --- chat.html specific logic ---
function setupChatPageListeners() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatType = urlParams.get('chatType');
    const partnerUid = urlParams.get('uid');
    const partnerName = urlParams.get('name');

    if (chatPartnerDisplay) {
        if (chatType === 'public') {
            chatPartnerDisplay.textContent = 'အုံကိုမ်ဝင်ꩻ';
            selectChat('public');
            if(viewGroupMembersButton) viewGroupMembersButton.classList.remove('hidden');
            if(viewPartnerProfileButton) viewPartnerProfileButton.classList.add('hidden');
        } else if (chatType === 'private' && partnerUid && partnerName) {
            chatPartnerDisplay.textContent = partnerName;
            selectChat('private', partnerUid);
            if(viewGroupMembersButton) viewGroupMembersButton.classList.add('hidden');
            if(viewPartnerProfileButton) viewPartnerProfileButton.classList.remove('hidden');
            selectedChatPartnerId = partnerUid;
            selectedChatPartnerDisplayName = partnerName;
        } else {
            window.location.href = 'main.html';
        }
    }
    
    if (backToMainButton) {
        backToMainButton.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    }

    if (viewPartnerProfileButton) {
        viewPartnerProfileButton.addEventListener('click', () => {
            if (selectedChatPartnerId) {
                profileModalTitle.textContent = `${selectedChatPartnerDisplayName || 'User'}'s Profile`;
                setProfileFieldsEditable(false);
                unfriendButton.classList.remove('hidden');
                unfriendButton.dataset.friendUid = selectedChatPartnerId;
                loadUserProfile(selectedChatPartnerId);
                profileModal.classList.remove('hidden');
                currentlyViewedProfileUid = selectedChatPartnerId;
            }
        });
    }

    if (viewGroupMembersButton) {
        viewGroupMembersButton.addEventListener('click', async () => {
            groupMembersList.innerHTML = '';
            for (const uid in allUsersData) {
                const member = allUsersData[uid];
                const listItem = document.createElement('li');
                listItem.textContent = member.displayName || 'Unknown User';
                listItem.classList.add('main-list-item');
                groupMembersList.appendChild(listItem);
            }
            groupMembersModal.classList.remove('hidden');
        });
    }

    if (closeGroupMembersModal) {
        closeGroupMembersModal.addEventListener('click', () => {
            groupMembersModal.classList.add('hidden');
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', async () => {
            const messageText = messageInput.value.trim();
            if (!currentChatRef || !currentUserId || messageText === '') {
                return;
            }

            try {
                await currentChatRef.push({
                    senderId: currentUserId,
                    senderName: auth.currentUser.displayName || 'Anonymous',
                    text: messageText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                messageInput.value = '';
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });
    }
    
    if (unfriendButton) {
        unfriendButton.addEventListener('click', async () => {
            const friendUidToUnfriend = unfriendButton.dataset.friendUid;
            if (friendUidToUnfriend && currentUserId && confirm(`Are you sure you want to unfriend ${allUsersData[friendUidToUnfriend].displayName}?`)) {
                try {
                    await usersRef.child(currentUserId).child('friends').child(friendUidToUnfriend).remove();
                    await usersRef.child(friendUidToUnfriend).child('friends').child(currentUserId).remove();
                    alert(`Unfriended ${allUsersData[friendUidToUnfriend].displayName}.`);
                    profileModal.classList.add('hidden');
                    window.location.href = 'main.html';
                } catch (error) {
                    console.error("Error unfriending:", error);
                }
            }
        });
    }
    
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            profileModal.classList.add('hidden');
        });
    }

    // Message Actions Modal Listeners
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            messageActionsModal.classList.add('hidden');
            messageToEditKey = null;
        });
    }

    if (editButton) {
        editButton.addEventListener('click', async () => {
            if (messageToEditKey && currentChatRef) {
                const newText = editMessageInput.value.trim();
                if (newText) {
                    try {
                        await currentChatRef.child(messageToEditKey).update({
                            text: newText,
                            edited: true
                        });
                        messageActionsModal.classList.add('hidden');
                    } catch (error) {
                        console.error("Error editing message:", error);
                    }
                }
            }
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (messageToEditKey && currentChatRef && confirm("Are you sure you want to delete this message?")) {
                try {
                        await currentChatRef.child(messageToEditKey).remove();
                    messageActionsModal.classList.add('hidden');
                } catch (error) {
                    console.error("Error deleting message:", error);
                }
            }
        });
    }
    
    // Listen for clicks on messages to show options
    if (messagesDiv) {
        messagesDiv.addEventListener('click', (event) => {
            const messageElement = event.target.closest('.message-container.sent');
            if (messageElement) {
                const messageKey = messageElement.dataset.messageKey;
                const messageText = messageElement.querySelector('p').textContent;
                
                messageToEditKey = messageKey;
                editMessageInput.value = messageText;
                messageActionsModal.classList.remove('hidden');
            }
        });
    }
}

function selectChat(chatType, partnerUid = null) {
    if (!messagesDiv) return;

    if (currentChatRef) {
        // Remove all previous listeners to prevent duplicates
        currentChatRef.off();
    }
    messagesDiv.innerHTML = '';
    messageElements = new Map();
    
    if (chatType === 'public') {
        currentChatRef = publicChatRef;
    } else if (chatType === 'private' && partnerUid) {
        const chatIds = [currentUserId, partnerUid].sort();
        const chatId = chatIds[0] + '_' + chatIds[1];
        currentChatRef = chatsRef.child(chatId).child('messages');
    }

    if (currentChatRef) {
        // Listener for new messages being added
        currentChatRef.on('child_added', (snapshot) => {
            const message = { key: snapshot.key, ...snapshot.val() };
            displayMessage(message);
        });

        // Listener for messages being changed (edited)
        currentChatRef.on('child_changed', (snapshot) => {
            const updatedMessage = { key: snapshot.key, ...snapshot.val() };
            updateMessage(updatedMessage);
        });

        // Listener for messages being removed
        currentChatRef.on('child_removed', (snapshot) => {
            removeMessage(snapshot.key);
        });
    }
}

function displayMessage(message) {
    if (!messagesDiv) return;

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    messageContainer.dataset.messageKey = message.key;
    messageElements.set(message.key, messageContainer);

    const messageElement = document.createElement('li');
    messageElement.classList.add('message');

    if (message.senderId === currentUserId) {
        messageContainer.classList.add('sent');
    } else {
        messageContainer.classList.add('received');
        const senderNameElement = document.createElement('span');
        senderNameElement.classList.add('sender-name');
        senderNameElement.textContent = message.senderName || 'Anonymous';
        messageContainer.appendChild(senderNameElement);
    }
    
    const textSpan = document.createElement('p');
    textSpan.textContent = message.text;
    messageElement.appendChild(textSpan);
    
    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    if (message.timestamp) {
        const date = new Date(message.timestamp);
        let timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (message.edited) {
            timeString += ' (edited)';
        }
        timestampSpan.textContent = timeString;
    }
    messageElement.appendChild(timestampSpan);
    
    messageContainer.appendChild(messageElement);
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateMessage(message) {
    const messageContainer = messageElements.get(message.key);
    if (messageContainer) {
        const textSpan = messageContainer.querySelector('p');
        const timestampSpan = messageContainer.querySelector('.timestamp');
        
        textSpan.textContent = message.text;
        
        if (message.timestamp) {
            const date = new Date(message.timestamp);
            let timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (message.edited) {
                timeString += ' (edited)';
            }
            timestampSpan.textContent = timeString;
        }
    }
}

function removeMessage(messageKey) {
    const messageContainer = messageElements.get(messageKey);
    if (messageContainer) {
        messagesDiv.removeChild(messageContainer);
        messageElements.delete(messageKey);
    }
}
