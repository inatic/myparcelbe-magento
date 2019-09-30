<?php
/**
 * Get all rates depending on base price
 *
 * LICENSE: This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe/magento
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2019 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release 2.0.0
 */

namespace MyParcelBE\Magento\Model\Rate;

use Countable;
use Magento\Checkout\Model\Session;
use MyParcelBE\Magento\Helper\Checkout;
use MyParcelBE\Magento\Helper\Data;
use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;

class Result extends \Magento\Shipping\Model\Rate\Result
{
    /**
     * @var \Magento\Eav\Model\Entity\Collection\AbstractCollection[]
     */
    private $products;

    /**
     * @var Checkout
     */
    private $myParcelHelper;

    /**
     * @var PackageRepository
     */
    private $package;

    /**
     * @var array
     */
    private $parentMethods = [];

    /**
     * @var bool
     */
    private $myParcelRatesAlreadyAdded = false;
    /**
     * @var Session
     */
    private $session;
    /**
     * @var \Magento\Backend\Model\Session\Quote
     */
    private $quote;

    /**
     * Result constructor.
     *
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Backend\Model\Session\Quote       $quote
     * @param Session                                    $session
     * @param Checkout                                   $myParcelHelper
     * @param PackageRepository                          $package
     *
     * @throws \Magento\Framework\Exception\LocalizedException
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @internal param \Magento\Checkout\Model\Session $session
     */
    public function __construct(
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Backend\Model\Session\Quote $quote,
        Session $session,
        Checkout $myParcelHelper,
        PackageRepository $package
    ) {
        parent::__construct($storeManager);

        $this->myParcelHelper = $myParcelHelper;
        $this->package        = $package;
        $this->session        = $session;
        $this->quote          = $quote;

        $this->parentMethods = explode(',', $this->myParcelHelper->getGeneralConfig('shipping_methods/methods', true));
        $this->package->setCurrentCountry($this->getQuoteFromCardOrSession()->getShippingAddress()->getCountryId());
        $this->products = $this->getQuoteFromCardOrSession()->getItems();
    }

    /**
     * Add a rate to the result
     *
     * @param \Magento\Quote\Model\Quote\Address\RateResult\AbstractResult|\Magento\Shipping\Model\Rate\Result $result
     *
     * @return $this
     */
    public function append($result)
    {
        if ($result instanceof \Magento\Quote\Model\Quote\Address\RateResult\Error) {
            $this->setError(true);
        }
        if ($result instanceof \Magento\Quote\Model\Quote\Address\RateResult\AbstractResult) {
            $this->_rates[] = $result;
        } elseif ($result instanceof \Magento\Shipping\Model\Rate\Result) {
            $rates = $result->getAllRates();
            foreach ($rates as $rate) {
                $this->append($rate);
                $this->addMyParcelRates($rate);
            }
        }

        return $this;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array
     */
    private function getMethods()
    {
        $methods = [
            'signature' => 'delivery/signature_',
            'pickup'    => 'pickup/',
        ];

        return $methods;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array
     */
    private function getAllowedMethods()
    {
        $methods = $this->getMethods();

        return $methods;
    }

    /**
     * Add Myparcel shipping rates
     *
     * @param $parentRate \Magento\Quote\Model\Quote\Address\RateResult\Method
     */
    private function addMyParcelRates($parentRate)
    {
        if ($this->myParcelRatesAlreadyAdded) {
            return;
        }

        $currentCarrier = $parentRate->getData('carrier');
        if (! in_array($currentCarrier, $this->parentMethods)) {
            return;
        }

        if (count($this->products) > 0) {
            $this->package->setWeightFromQuoteProducts($this->products);
        }

//        foreach ($this->getAllowedMethods() as $alias => $settingPath) {
//            $settingActive = $this->myParcelHelper->getConfigValue(Data::XML_PATH_BPOST_SETTINGS . $settingPath . 'active');
//            $active        = $settingActive === '1' || $settingActive === null;
//            if ($active) {
//                $method = $this->getShippingMethod($alias, $settingPath, $parentRate);
//                $this->append($method);
//            }
//        }

        $this->myParcelRatesAlreadyAdded = true;
    }

    /**
     * @param        $alias
     * @param string $settingPath
     * @param        $parentRate \Magento\Quote\Model\Quote\Address\RateResult\Method
     *
     * @return \Magento\Quote\Model\Quote\Address\RateResult\Method
     */
    private function getShippingMethod($alias, $settingPath, $parentRate)
    {
        $method = clone $parentRate;
        $this->myParcelHelper->setBasePrice($parentRate->getPrice());

        $title = $this->createTitle($settingPath);
        $price = $this->createPrice($alias, $settingPath);
        $method->setCarrierTitle($alias);
        $method->setMethod($alias);
        $method->setMethodTitle($title);
        $method->setPrice($price);
        $method->setCost(0);

        return $method;
    }

    /**
     * Create title for method
     * If no title isset in config, get title from translation
     *
     * @param $settingPath
     *
     * @return \Magento\Framework\Phrase|mixed
     */
    private function createTitle($settingPath)
    {
        $title = $this->myParcelHelper->getConfigValue(Data::XML_PATH_BPOST_SETTINGS . $settingPath . 'title');

        if ($title === null) {
            $title = __($settingPath . 'title');
        }

        return $title;
    }

    /**
     * Create price
     * Calculate price if multiple options are chosen
     *
     * @param $alias
     * @param $settingPath
     *
     * @return float
     */
    private function createPrice($alias, $settingPath)
    {
        return $this->myParcelHelper->getMethodPrice($settingPath . 'fee', $alias);
    }

    /**
     * Can't get quote from session\Magento\Checkout\Model\Session::getQuote()
     * To fix a conflict with buckeroo, use \Magento\Checkout\Model\Cart::getQuote() like the following
     *
     * @return \Magento\Quote\Model\Quote
     * @throws \Magento\Framework\Exception\LocalizedException
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    private function getQuoteFromCardOrSession() {
        if ($this->quote->getQuoteId() != null &&
            $this->quote->getQuote() &&
            $this->quote->getQuote() instanceof Countable &&
            count($this->quote->getQuote())
        ){
            return $this->quote->getQuote();
        }

        return $this->session->getQuote();
    }
}
