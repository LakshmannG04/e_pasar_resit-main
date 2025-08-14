// Use environment variables for deployment
const server_base = process.env.REACT_APP_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const Endpoint = {
    sample: `${server_base}/sample`,
    signup: `${server_base}/signup`,
    login: `${server_base}/login`,
    category: `${server_base}/category`,
    products: `${server_base}/products`,
    cart: `${server_base}/cart`,
    checkout: `${server_base}/checkout`,
    banners: `${server_base}/banners`,
    orders: `${server_base}/orders`,
    featuredProducts: `${server_base}/featuredProducts`,
    proceedToPayment: `${server_base}/proceedToPayment`,
    verifyAdminToken: `${server_base}/../schedule/verifyToken`,
    admin: `${server_base}/admin`,
    adminLogin: `${server_base}/login`,
    adminUsers: `${server_base}/admin/users`,
    suspendAccount: `${server_base}/admin/changeAccountStatus`,
    approveSeller: `${server_base}/admin/approve-seller`,
    rejectSeller: `${server_base}/admin/reject-seller`,
    sellerApplication: `${server_base}/admin/seller_application`,
    addAdmin: `${server_base}/admin/add-admin`,
    userProfile: `${server_base}/profile`,
    updateUser: `${server_base}/user/update`,
    // New endpoints for upgraded features
    suggestCategory: `${server_base}/products/suggest-category`,
    generateImage: `${server_base}/products/generate-image`,
    imageOptions: `${server_base}/products/image-options`,
    trackView: `${server_base}/products/track-view`,
    viewStats: `${server_base}/products/view-stats`,
    popularProducts: `${server_base}/products/popular`,
    categoriesInfo: `${server_base}/products/categories-info`,
    // Communication/Messaging endpoints
    createDispute: `${server_base}/communication/create-dispute`,
    myConversations: `${server_base}/communication/my-conversations`,
    conversationMessages: `${server_base}/communication/conversation`,
    sendMessage: `${server_base}/communication/conversation`,
    manageDispute: `${server_base}/communication/conversation`,
    unreadCount: `${server_base}/communication/unread-count`,
    searchUsers: `${server_base}/communication/search-users`,
    // NEW ENHANCED COMMUNICATION ENDPOINTS
    contactSeller: `${server_base}/communication/contact-seller`,
    contactAdmin: `${server_base}/communication/contact-admin`,
    reportConversation: `${server_base}/communication/report-conversation`,
    // Recommendation System endpoints
    userRecommendations: `${server_base}/products/recommendations/user`,
    productRecommendations: `${server_base}/products/recommendations/product`,
    trendingRecommendations: `${server_base}/products/recommendations/trending`,
    categoryRecommendations: `${server_base}/products/recommendations/category`
    //add more endpoints here
};



export default Endpoint;