<?php


namespace AppBundle\Entity\Menu;


use ApiPlatform\Core\Annotation\ApiProperty;
use ApiPlatform\Core\Annotation\ApiResource;
use AppBundle\Entity\Base\Thing;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Class MenuItemModifier
 * Represent a modifier that can be added to a MenuItem
 *
 * @ORM\Entity()
 * @ApiResource(
 *  shortName="MenuItemModifier",
 *  itemOperations={
 *    "get"={"method"="GET"}
 * })
 *
 */
class MenuItemModifier extends Thing
{
    /**
     * @var int
     *
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $id;

    /**
     * The strategy to calculate the extra-price involved by adding the modifier.
     *
     * Possible values:
     *  - FREE no extra price
     *  - ADD_MENUITEM_PRICE add price of the extra
     *  - ADD_MODIFIER_PRICE add the fixed price of the menu item
     *
     * @var string
     *
     * @ORM\Column(type="string")
     * @Groups({"restaurant"})
     *
     */
    protected $calculusStrategy;

    /**
     * @ORM\Column(type="float")
     * @ApiProperty(iri="https://schema.org/price")
     * @Groups({"restaurant"})
     */
    protected $price;

    /**
     * The menu item this modifier belongs to
     *
         * @ORM\ManyToOne(targetEntity="AppBundle\Entity\Menu\MenuItem", inversedBy="modifiers", cascade={"persist"})
     */
    protected $menuItem;

    /**
     * The choices the user can select from.
     *
     * @ORM\OneToMany(targetEntity="AppBundle\Entity\Menu\Modifier", mappedBy="menuItemModifier", cascade={"persist"})
     * @Groups({"restaurant"})
     */
    protected $modifierChoices;

    public function __construct()
    {
        $this->modifierChoices = new ArrayCollection();
    }

    /**
     * @return int
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId(int $id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getCalculusStrategy()
    {
        return $this->calculusStrategy;
    }

    /**
     * @param string $calculusStrategy
     */
    public function setCalculusStrategy($calculusStrategy)
    {
        $this->calculusStrategy = $calculusStrategy;
    }

    /**
     * @return float
     */
    public function getModifierPrice($modifier)
    {
        if ($this->getCalculusStrategy() === 'FREE') {
            $price = (float)0;
        }
        else if ($this->getCalculusStrategy() === 'ADD_MENUITEM_PRICE') {
            $price = $modifier->getPrice();
        }
        else if ($this->getCalculusStrategy() === 'ADD_MODIFIER_PRICE') {
            $price = $this->getPrice();
        }
        else {
            throw new \Exception("Unhandled modifier calculus method");
        }

        return $price;
    }

    /**
     * @return mixed
     */
    public function getPrice()
    {
        return $this->price;
    }


    /**
     * @param float $price
     */
    public function setPrice($price)
    {
        $this->price = $price;
    }

    /**
     * @return mixed
     */
    public function getModifierChoices()
    {
        return $this->modifierChoices;
    }

    /**
     * @param mixed $modifierChoices
     */
    public function setModifierChoices($modifierChoices)
    {
        $this->modifierChoices = $modifierChoices;
    }

    /**
     * @return mixed
     */
    public function getMenuItem()
    {
        return $this->menuItem;
    }

    /**
     * @param mixed $menuItem
     */
    public function setMenuItem($menuItem)
    {
        $this->menuItem = $menuItem;
    }

    public function addModifierChoice(Modifier $modifier) {
        $modifier->setMenuItemModifier($this);
        $this->modifierChoices->add($modifier);
    }

}