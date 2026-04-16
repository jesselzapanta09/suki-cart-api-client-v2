<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminStoreVerificationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Home\HomeProductSearchController;
use App\Http\Controllers\Notification\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Seller\SellerProductController;
use App\Http\Controllers\Seller\SellerStoreController;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register/customer', [AuthController::class, 'registerCustomer']);
Route::post('/register/seller',   [AuthController::class, 'registerSeller']);
Route::post('/login',             [AuthController::class, 'login']);
Route::get('/verify-email',       [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password',     [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',      [AuthController::class, 'resetPassword']);

// Public product routes
Route::get('/products/search', [HomeProductSearchController::class, 'index']);
Route::get('/products/{id}', [HomeProductSearchController::class, 'show']);

Route::get('/categories', function () {
    return response()->json(Category::where('status', 1)->orderBy('name')->get());
});

// Authenticated routes
Route::middleware('auth:api')->group(function () {

    // Profile routes (all roles)
    Route::get('/profile',          [ProfileController::class, 'show']);
    Route::post('/profile/info',    [ProfileController::class, 'updateInfo']);
    Route::post('/profile/address', [ProfileController::class, 'updateAddress']);
    Route::post('/profile/store',   [ProfileController::class, 'updateStore']);
    Route::post('/profile/password',[ProfileController::class, 'changePassword']);

    // Notification routes (all roles)
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',        [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',      [NotificationController::class, 'markAllRead']);
    Route::get('/notifications/vapid-public-key',    [NotificationController::class, 'vapidPublicKey']);
    Route::post('/notifications/push-subscription',  [NotificationController::class, 'savePushSubscription']);
    Route::delete('/notifications/push-subscription',[NotificationController::class, 'deletePushSubscription']);
    Route::post('/notifications/{id}/mark-read',     [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}',             [NotificationController::class, 'destroy']);

    // Admin routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users',         [AdminUserController::class, 'index']);
        Route::get('/users/{id}',    [AdminUserController::class, 'show']);
        Route::post('/users',        [AdminUserController::class, 'store']);
        Route::post('/users/{id}',   [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

        Route::get('/categories',         [AdminCategoryController::class, 'index']);
        Route::get('/categories/{id}',    [AdminCategoryController::class, 'show']);
        Route::post('/categories',        [AdminCategoryController::class, 'store']);
        Route::put('/categories/{id}',    [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

        Route::get('/store-verifications',                      [AdminStoreVerificationController::class, 'index']);
        Route::get('/store-verifications/{store}',         [AdminStoreVerificationController::class, 'show']);
        Route::get('/store-verifications/{store}/logs',    [AdminStoreVerificationController::class, 'logs']);
        Route::post('/store-verifications/{store}/approve', [AdminStoreVerificationController::class, 'approve']);
        Route::post('/store-verifications/{store}/reject',  [AdminStoreVerificationController::class, 'reject']);
        Route::post('/store-verifications/{store}/pending', [AdminStoreVerificationController::class, 'pending']);
        Route::get('/store-verification-logs',              [AdminStoreVerificationController::class, 'allLogs']);
        Route::post('/store-verification-logs/{logId}/revert', [AdminStoreVerificationController::class, 'revertLog']);
    });

    // Seller routes
    Route::middleware('role:seller')->prefix('seller')->group(function () {
        // Always accessible (no store verification needed)
        Route::get('/store-status', [SellerStoreController::class, 'status']);
        Route::post('/resubmit-store', [SellerStoreController::class, 'resubmit']);

        // Only accessible when store is verified
        Route::middleware('store.verified')->group(function () {
            Route::get('/products', [SellerProductController::class, 'index']);
            Route::get('/products/{id}', [SellerProductController::class, 'show']);
            Route::post('/products', [SellerProductController::class, 'store']);
            Route::put('/products/{id}', [SellerProductController::class, 'update']);
            Route::delete('/products/{id}', [SellerProductController::class, 'destroy']);
        });
    });



    // Customer routes
    Route::middleware('role:customer')->prefix('customer')->group(function () {
        // TODO: add customer routes
    });
});
